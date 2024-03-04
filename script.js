var googleCalendarEvents;
var tg;
var chatId;

let events = [];

manipulate();
hideRedCircle();

let lastKnownMousePosition = { x: 0, y: 0 };

var calendar;
var new_event;
var clickedEvent;
var parentElement;
var oldClickedEvent;

var repeatOnMonth = 1;
var calendarElement = document.getElementById('calendar');
var customCalendarPopup = document.getElementById('custom-calendar-popup');

var new_ends_on = getTodayDate();
var newInfo;
var recurrent_events;
var hidePopupTimeout;
var showPopupDelayTimeout;
var changed_events = [];

var popup = document.getElementById('undo-popup');
var undoPopupText = document.getElementById('undo-span-text');
var left = calendarElement.clientWidth/2 + 50;
var top = calendarElement.clientHeight*2 - 50;
popup.style.left = `${left}px`;
popup.style.top = `${top}px`;

var recurrence_popup = document.getElementById('custom-recurrence-popup');
var backdrop = document.getElementById('modal-backdrop');
var recurrenceCancelButton = document.getElementById('recurrence-cancel-button');
var recurrenceDoneButton = document.getElementById('recurrence-done-button');
var repeatEveryType = document.getElementById('repeat-type');
var repeatEveryInput = document.getElementById('repeat-every-input');
var radioEndsNever = document.getElementById('radio-ends-never');
var radioEndsOn = document.getElementById('radio-ends-on');
var radioEndsAfter = document.getElementById('radio-ends-after');
var inputEndsOn = document.getElementById('input-ends-on');
inputEndsOn.value = formatDateToUserFriendly(new_ends_on);
var inputEndsAfter = document.getElementById('input-ends-after');

updateDisabledStates();

var element = document.querySelector(".days-of-week");
parentElement = document.querySelector("#repeat-on");
addDaysOfWeek(parentElement);

days = document.querySelectorAll('.day');
repeatOnResponse(days);

var event_popup = document.getElementById('custom-event-popup');
var closeIcon = document.getElementById('close-icon');
var trash = document.getElementById('delete-event-trash');
var save = document.getElementById('event-save');
var eventDate = document.getElementById('event-date');
var eventStartTime = document.getElementById('event-start');
var eventEndTime = document.getElementById('event-end');
var recurrenceButton = document.getElementById('recurrence-button');
var moreOptionsButton = document.getElementById('event-more-options');
var dragHandle = document.getElementById('drag-handle');
makeDraggable(event_popup, dragHandle);

var discardPopup = document.getElementById('discard-changes');
var cancelDiscard = document.getElementById('cancel-discard');
var confirmDiscard = document.getElementById('confirm-discard');

var deleteRecurringEventPopup = document.getElementById('delete-recurring-event');
var cancelDelete = document.getElementById('cancel-delete');
var confirmDelete = document.getElementById('confirm-delete');
var deleteThisEvent = document.getElementById('delete-this-event');
var deleteAllEvents = document.getElementById('delete-all-events');
var radioDeleteThisEvent = document.getElementById('radio-delete-this-event');
var radioDeleteAllEvents = document.getElementById('radio-delete-all-events');

var contextMenuPopup = document.getElementById('context-menu-popup');

var allChangedEvents = [];

function showContextMenuPopup() {
    contextMenuPopup.classList.remove('recurrence-box-hidden');
    contextMenuPopup.classList.add('recurrence-box');
}

function hideContextMenuPopup() {
    contextMenuPopup.classList.remove('recurrence-box');
    contextMenuPopup.classList.add('recurrence-box-hidden');
}

deleteAllEvents.addEventListener('click', function() {
    radioDeleteAllEvents.checked = true;
})

deleteThisEvent.addEventListener('click', function() {
    radioDeleteThisEvent.checked = true;
})

customCalendarPopup.addEventListener('mousedown', function(event) {
    event.preventDefault();
});

function isInRecurrentEvents() {
    if (allChangedEvents && allChangedEvents.length > 0 && clickedEvent) {
        return allChangedEvents.filter(list_changed_events =>
            list_changed_events.some(event =>
                event.start.getTime() == clickedEvent.start.getTime()
            )
        )
    }
    return [];
}

function processDeleteEvents() {
    var filteredRecurrentList = isInRecurrentEvents();
    changed_events = filteredRecurrentList[0];
    if (filteredRecurrentList && filteredRecurrentList.length > 0) {
        showDeleteRecurringEventPopup();
    } else {
        if (clickedEvent) {
            changed_events = [];
            changed_events.push(clickedEvent);
            clickedEvent.remove();
            hideEventPopup();
        }
        showUndoPopup('delete');
    }
}

trash.addEventListener('click', function() {
    processDeleteEvents();
});

confirmDelete.addEventListener('click', function() {
    if (radioDeleteThisEvent.checked) {
        if (clickedEvent) {
//            changed_events = [];
            changed_events = changed_events.filter(event =>
            event.start.getTime() !== clickedEvent.start.getTime() &&
            event.end.getTime() !== clickedEvent.end.getTime())

            allChangedEvents = allChangedEvents.map(list_changed_events =>
                list_changed_events.filter(event =>
                    !(event.start.getTime() === clickedEvent.start.getTime() && event.end.getTime() === clickedEvent.end.getTime())
                )
            );

            clickedEvent.remove();
        }
    } else if (radioDeleteAllEvents.checked) {
        allChangedEvents = allChangedEvents.filter(list_changed_events =>
            !list_changed_events.some(event =>
                event.start.getTime() === clickedEvent.start.getTime() &&
                event.end.getTime() === clickedEvent.end.getTime()
            )
        );

        handleSave();
    }
    hideEventPopup();
    showUndoPopup('delete');
    hideDeleteRecurringEventPopup();
})

cancelDelete.addEventListener('click', function() {
    hideDeleteRecurringEventPopup();
})

function hideDeleteRecurringEventPopup() {
    deleteRecurringEventPopup.classList.remove('recurrence-box')
    deleteRecurringEventPopup.classList.add('recurrence-box-hidden')
    backdrop.style.display = 'none';
}

function showDeleteRecurringEventPopup() {
    deleteRecurringEventPopup.classList.remove('recurrence-box-hidden')
    deleteRecurringEventPopup.classList.add('recurrence-box')
    backdrop.style.display = 'block';
    var top = calendarElement.clientHeight/2;
    var left = calendarElement.clientWidth/2 - 100;

    // Position the popup and show it
    deleteRecurringEventPopup.style.top = `${top}px`;
    deleteRecurringEventPopup.style.left = `${left}px`;
    radioDeleteThisEvent.checked = true;
}

closeIcon.addEventListener('click', function() {
    if (recurrent_events && recurrent_events.length > 0) {
        showDiscardPopup();
    } else {
        recurrent_events = [];
        closeActiveWindows();
    }
})

function hideDiscardPopup() {
    discardPopup.classList.remove('recurrence-box')
    discardPopup.classList.add('recurrence-box-hidden')
    backdrop.style.display = 'none';
}

function showDiscardPopup() {
    discardPopup.classList.remove('recurrence-box-hidden')
    discardPopup.classList.add('recurrence-box')
    backdrop.style.display = 'block';
    var top = calendarElement.clientHeight/2;
    var left = calendarElement.clientWidth/2 - 100;

    // Position the popup and show it
    discardPopup.style.top = `${top}px`;
    discardPopup.style.left = `${left}px`;
}

cancelDiscard.addEventListener('click', function() {
    hideDiscardPopup();
    clickedEvent = '';
    calendar.addEvent(new_event);
    showEventPopup();
})

confirmDiscard.addEventListener('click', function() {
    recurrent_events = [];
    if (new_event) {
        new_event.remove();
        new_event = '';
    }
    closeActiveWindows();
    hideRedCircle();
    hideDiscardPopup();
})

function hideEventPopup() {
    event_popup.classList.remove('recurrence-box');
    event_popup.classList.add('recurrence-box-hidden');
}

function makeDraggable(element, handle) {
    var offsetX, offsetY, mouseDown = false;

    handle.onmousedown = function(e) {
        element.style.transition = 'left 0s, top 0s, opacity 0.5s ease';
        // When mouse down on the handle, prepare to start dragging
        mouseDown = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        document.onmousemove = onMouseMove;
        document.onmouseup = onMouseUp;
        return false; // Prevent default dragging action
    };

    function onMouseMove(e) {
        if (!mouseDown) return;
        // Update the position of the popup as the mouse moves
        element.style.left = e.clientX - offsetX + 'px';
        element.style.top = e.clientY - offsetY + 'px';
    }

    function onMouseUp() {
        // Stop dragging
        element.style.transition = 'left 0.2s ease, top 0.2s ease, opacity 0.5s ease';
        mouseDown = false;
        document.onmousemove = null;
        document.onmouseup = null;
    }
}

function showEventPopup() {
    event_popup.classList.remove('recurrence-box-hidden');
    event_popup.classList.add('recurrence-box');
}

function hideRecurrencePopup() {
    recurrence_popup.classList.remove('recurrence-box');
    recurrence_popup.classList.add('recurrence-box-hidden');
}

document.addEventListener('mousemove', (e) => {
    lastKnownMousePosition.x = e.clientX;
    lastKnownMousePosition.y = e.clientY;
});

function convertToAMPM(dateString) {
  // Parse the ISO string
  const date = new Date(dateString);

  // Format the time in AM/PM format
  const options = { hour: 'numeric', minute: 'numeric', hour12: true };
  const timeString = date.toLocaleTimeString('en-US', options);

  // Replace uppercase PM and AM with lowercase
  return timeString.replace(' PM', 'pm').replace(' AM', 'am');
}

function formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    const strTime = hours + ':' + minutes + ampm;
    return strTime;
}

function formatDateToUserFriendly(inputDateString) {
    // Parse the input date string into a Date object
    const date = new Date(inputDateString);

    // Use Intl.DateTimeFormat to format the date in the desired output
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
    return formattedDate
}

function increaseDateTime(inputDateString, hours) {
    let date = new Date(inputDateString);
    let hoursToAdd = hours;
    date.setHours(date.getHours() + hoursToAdd);
    return date
}

function showPopupOnEventClick(x, y) {
    hideContextMenuPopup();
    // Calculate the position for the popup.
    var x_left = x + 430 <= calendarElement.clientWidth ? x + 100 : x - 380;
    var left = x_left - 100 > 0 ? x_left : 100;
    var y_top = y + 150 <= calendarElement.clientHeight ? y : y - 100;
    if (calendarElement.clientWidth < 600) {
        left = calendarElement.clientWidth > 400 ? calendarElement.clientWidth*0.3 : calendarElement.clientWidth*0.1
        var top = y >= calendarElement.clientHeight*0.6 ? y - 200 : y + 50;
    } else {
        top = y_top
    }

    // Position the popup and show it
    event_popup.style.top = `${top}px`;
    event_popup.style.left = `${left}px`;
    showEventPopup();
}

function clearBlur() {
    eventDate.blur();
    eventStartTime.blur();
    eventEndTime.blur();
    customCalendarPopup.classList.add('hidden');
}

function createEvent(info) {
    function updateInputDateTimeFields(info, endTime) {
        eventDate.value = formatDateToUserFriendly(info.dateStr);
        eventStartTime.value = convertToAMPM(info.dateStr);
        eventEndTime.value = convertToAMPM(endTime);
    }

    endTime = increaseDateTime(info.dateStr, 1);
    var newEvent = {
        title: 'Do not disturb',
        start: info.dateStr,
        end: endTime,
        backgroundColor: 'green',
        borderColor: 'green'
    };
    new_event = calendar.addEvent(newEvent);
    updateInputDateTimeFields(info, endTime);

    // Calculate the position for the popup.
    var x = info.jsEvent.clientX;
    var y = info.jsEvent.clientY;
    showPopupOnEventClick(x, y);
}

function showMoreSaveButtons() {
    moreOptionsButton.style.display = 'block';
    save.style.display = 'block';
}

function toggleMoreSaveButtons() {
    if (recurrent_events && recurrent_events.length > 0) {
        showRedCircle();
        showMoreSaveButtons();
    } else if (new_event) {
        showMoreSaveButtons();
    } else {
        hideRedCircle();
        moreOptionsButton.style.display = 'none';
        save.style.display = 'none';
    }
}

function closeActiveWindows() {
    hideEventPopup();
    hideRecurrencePopup();
    hideContextMenuPopup();
    if (new_event) {
        new_event.remove();
        new_event = '';
    }
}

function onDateClick(info, calendar, events) {
    clearBlur();
    moreOptionsButton.style.display = 'block';
    save.style.display = 'block';
    hideContextMenuPopup();
    var is_recurrence_active = recurrence_popup.classList.contains('recurrence-box');
    var is_event_active = event_popup.classList.contains('recurrence-box');

    function handleRecurrence() {
        if (new_event) {
            new_event.remove();
        }
        createEvent(info);
    }

    function handleCreateEvent() {
        clickedEvent = '';
        trash.style.cursor = 'default';
        trash.style.opacity = '0';
        trash.style.display = 'none';
        createEvent(info);
    }

    if (recurrent_events && recurrent_events.length > 0) {
        handleRecurrence();
    } else if (is_recurrence_active || is_event_active) {
        closeActiveWindows();
    } else {
        handleCreateEvent();
    }
}

function getEventBoundingCords(info) {
    var elementRect = info.el.getBoundingClientRect();
    var x = elementRect.left + window.scrollX + 30;
    var y = elementRect.top + window.scrollY;
    return {x, y}
}

function setEventNewDateStartEndTime(info) {
    eventDate.value = formatDateToUserFriendly(info.event.start.toDateString());
    eventStartTime.value = formatAMPM(info.event.start);
    eventEndTime.value = formatAMPM(info.event.end);
}

function isClickedOnTheSameEvent(clickedEv, info) {
    var startClickedEv = clickedEvent.start.getTime()
    var endClickedEv = clickedEvent.end.getTime()
    var startInfoEv = info.event.start.getTime()
    var endInfoEv = info.event.end.getTime()
    return startClickedEv == startInfoEv && endClickedEv == endInfoEv
}

function onEventClick(info) {
    clearBlur();
    if (clickedEvent) {
        if (!isClickedOnTheSameEvent(clickedEvent, info)){
            recurrent_events = []
            hideRedCircle();
        }
    }

    clickedEvent = info.event;
    const {x, y} = getEventBoundingCords(info);
    setEventNewDateStartEndTime(info);

    var is_recurrence_active = recurrence_popup.classList.contains('recurrence-box');
    var is_event_active = event_popup.classList.contains('recurrence-box');
    if (is_recurrence_active || is_event_active) {
        if (new_event){
            if (new_event.start.getTime() != clickedEvent.start.getTime()) {
                new_event.remove();
                new_event = '';
            } else {
                clickedEvent = '';
            }
            showPopupOnEventClick(x, y);
        } else {
            showPopupOnEventClick(x, y);
        }
    } else {
        showPopupOnEventClick(x, y);
    }
    if (!new_event) {
        showTrash();
    }
    toggleMoreSaveButtons();
}

function handleEventDrop(info) {
    var x = lastKnownMousePosition.x
    var y = lastKnownMousePosition.y
    setEventNewDateStartEndTime(info);
    showPopupOnEventClick(x, y);
    if (new_event) {
        new_event = info.event;
    }
    if (clickedEvent) {
        clickedEvent = info.event;
        showUndoPopup(info);
        showTrash();
        toggleMoreSaveButtons();
    }
    if (!clickedEvent && !new_event) {
        clickedEvent = info.event;
    }
    update(info);
}

function handleEventDragStart(info) {
    if (new_event) {
        var infoEvent = new Date(info.event.start);
        var newEvent = new Date(new_event.start);

        if (infoEvent.getTime() !== newEvent.getTime()) {
            new_event.remove()
            new_event = '';
            clickedEvent = info.event;
        }
    } else if (!clickedEvent) {
        clickedEvent = info.event;
    }
}

function handleEventResize(info) {
    if (clickedEvent) {
        showUndoPopup(info);
    } else if (new_event && info.event.start.getTime() !== new_event.start.getTime()) {
        new_event.remove();
        new_event = '';
    }
    else if (!clickedEvent && !new_event) {
        clickedEvent = info.event;
        showUndoPopup(info);
    }
    update(info);
}

function isNewEventWithRecurrence() {
    if (new_event && recurrent_events && recurrent_events.length > 0) {
        if (new_event.start.getTime() == info.event.start.getTime() &&
            new_event.end.getTime() == info.event.end.getTime()) {
            console.log('the same');
        } else {
            recurrent_events = []
            hideRedCircle();
        }
    }
}

function manipulate() {
    var calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        editable: true,
        views: {
            listWeek: { buttonText: 'list1' }
        },
        headerToolbar: {
            start: 'prevYear,prev,next,nextYear',
            center: 'title',
            end: 'customSave'
        },

        customButtons: {
            customSave: {
                text: 'Confirm',
                click: function() {
                    var allEvents = calendar.getEvents();
		    var chatId = tg.initDataUnsafe.user.id;
                    sendDataToServer(allEvents, chatId);
                }
            },
        },

        events: events,

//        datesSet: function(info) {
//            if (event_popup && discardPopup && popup && recurrence_popup) {
//                closeActiveWindows();
//            }
//        },

        eventClick: function(info) {
            if (new_event && recurrent_events && recurrent_events.length > 0) {
                if (new_event.start.getTime() == info.event.start.getTime() &&
                    new_event.end.getTime() == info.event.end.getTime()) {
                    onEventClick(info);
                }
                console.log('There are recurrent dates.');
            } else {
                onEventClick(info);
            }
        },

        dateClick: function(info) {
            if (new_event && recurrent_events && recurrent_events.length > 0) {
                console.log(clickedEvent)
                if (!clickedEvent || new_event.start.getTime() == info.dateStr) {
                    console.log('the same');
                } else {
                    showDiscardPopup();
                }
            } else if (clickedEvent && recurrent_events && recurrent_events.length > 0) {
                showDiscardPopup();
            }
            onDateClick(info, calendar, events);
        },

        eventResize: function(info) {
            if (new_event && recurrent_events && recurrent_events.length > 0) {
                if (new_event.start.getTime() == info.event.start.getTime()) {
                    console.log('the same');
                } else {
                    showDiscardPopup();
                }
            }
            handleEventResize(info);
        },

        eventDragStart: function(info) {
            if (new_event && recurrent_events && recurrent_events.length > 0) {
                if (new_event.start.getTime() == info.event.start.getTime()) {
                    console.log('the same');
                } else {
                    showDiscardPopup();
                }
            }
            handleEventDragStart(info);
        },

        eventDrop: function(info) {
            handleEventDrop(info);
        },

        eventDidMount: function(info) {
            info.el.setAttribute('data-event-start', info.event.start);
            info.el.setAttribute('data-event-end', info.event.end);
        }

    });

    calendar.render();

    calendarEl.addEventListener('contextmenu', function(event) {
        event.preventDefault(); // Prevent the default context menu
        let clickedElement = event.target.closest('.fc-event');
        if (clickedElement) {
            processClickedElement(calendar, clickedElement);
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    tg = window.Telegram.WebApp;
    // chatId = tg.initDataUnsafe.user.id;
    get_existing_unavailable_time();
});

function formatGoogleCalendarDays() {
    function convertTime(newDate, time) {
        times = time.split('-');
        let newStartTime = concatenateDateTime(newDate, times[0]);
        let newEndTime = concatenateDateTime(newDate, times[1]);
        return {newStartTime, newEndTime}
    }

    function createCalendarDays(startTime, endTime) {
        var event = {
            title: 'Do not disturb',
            start: startTime,
            end: endTime,
            backgroundColor: 'green',
            borderColor: 'green'
        };
        calendar.addEvent(event);
    }

    googleCalendarEvents.forEach(function(calendarEvent) {
        let date = calendarEvent.date;
        let time = calendarEvent.time;
        let newDate = new Date(date);
        if (Array.isArray(time)){
            time.forEach(function(singleTime) {
                const {newStartTime, newEndTime} = convertTime(newDate, singleTime);
                createCalendarDays(newStartTime, newEndTime);
            })
        } else {
            const {newStartTime, newEndTime} = convertTime(newDate, time);
            createCalendarDays(newStartTime, newEndTime);
        }
    })
}

function get_existing_unavailable_time() {
    fetch('http://localhost:5000/get_existing_unavailable_time', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: tg.initDataUnsafe.user.id
        })
    })
    .then(response => response.json())
    .then(data => {
    if (data.busy_times) {
        googleCalendarEvents = data.busy_times;
        manipulate();
        formatGoogleCalendarDays();
        }
    })
    .catch(error => console.error("Error:", error));
}

function sendDataToServer(allEvents, chatId) {
    fetch('http://localhost:5000/process_dates', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            dates: allEvents, // Array of selected dates
            chat_id: chatId // chat_id field
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        tg.close();
    })
    .catch(error => {
        console.error('Error:', error);
        tg.close();
    });
}

function processClickedElement(calendar, clickedElement) {
    function isOldEventFunc(calendarEvent) {
        var allEvents = calendar.getEvents();
        return allEvents.some(function(event) {
            if (new_event) {
                return event.start.getTime() == calendarEvent.start.getTime() &&
                event.start.getTime() !== new_event.start.getTime()
            }
            return true;
        })
    }

    var eventStart = clickedElement.getAttribute('data-event-start');
    var eventEnd = clickedElement.getAttribute('data-event-end');
    if (eventStart && eventEnd) {
        let calendarEvent = getEventByStartAndEnd(calendar, eventStart, eventEnd);
        if (calendarEvent) {
            var isOldEvent = isOldEventFunc(calendarEvent);
            if (isOldEvent) {
                if (new_event) {
                    new_event.remove();
                }
                hideEventPopup();
                processContextMenuPopup(clickedElement);
                clickedCalendarEvent = calendarEvent;
                clickedEvent = calendarEvent;
            }
        }
    }
}


function processContextMenuPopup(clickedElement) {
    var rect = clickedElement.getBoundingClientRect()
    var y = rect.top;
    var x = rect.left;

    var x_left = x + 430 <= calendarElement.clientWidth ? x + 10 : x - 250;
    var left = x_left - 100 > 0 ? x_left : 100;
    var y_top = y + 150 <= calendarElement.clientHeight ? y : y - 100;
    if (calendarElement.clientWidth < 600) {
        left = calendarElement.clientWidth > 400 ? calendarElement.clientWidth*0.3 : calendarElement.clientWidth*0.1
        var top = y >= calendarElement.clientHeight*0.6 ? y - 200 : y + 50;
    } else {
        top = y_top
    }
    contextMenuPopup.style.top = `${top}px`;
    contextMenuPopup.style.left = `${left + clickedElement.offsetWidth + 10}px`;
    showContextMenuPopup();
}

contextMenuPopup.addEventListener('click', function() {
    processDeleteEvents();
    hideContextMenuPopup();
});

function getEventByStartAndEnd(calendar, start, end) {
    let allEvents = calendar.getEvents();
    var start = new Date(start);
    let matchingEvents = allEvents.filter(event =>
        event.start.getTime() === start.getTime());
    return matchingEvents.length > 0 ? matchingEvents[0] : null;
}

function showTrash() {
    trash.style.cursor = 'pointer';
    trash.style.opacity = '1';
    trash.style.display = 'block';
}

function update(info) {
    var startDate = info.event.start;
    var endDate = info.event.end;
    if (startDate && endDate) {
        // Adjust the end date to the end of the start date
        var adjustedEndDate = new Date(startDate);
        adjustedEndDate.setHours(23, 59, 59, 999); // Set to the end of the start date

        // If the end date is after the adjusted end date, revert the resize
        if (endDate > adjustedEndDate) {
            alert('Events cannot span multiple days.');
            info.revert();
        } else {
            eventStartTime.value = formatAMPM(startDate);
            eventEndTime.value = formatAMPM(endDate);
            updateEvent(startDate, endDate);
        }
    }
}

function showRecurrencePopup(backdrop) {
    recurrence_popup.classList.remove('recurrence-box-hidden');
    recurrence_popup.classList.add('recurrence-box');
    backdrop.style.display = 'block';
    elementsToEnable = [repeatEveryType, repeatEveryInput, recurrenceCancelButton, recurrenceDoneButton]
    var redCircle = document.getElementById('red-circle');

    function resetRecurrencePopup() {
        resetRepeatOn(days);
        repeatEveryInput.value = 1;
        if (repeatEveryType.value !== 'week'){
            parentElement = addDaysOfWeek(parentElement);
            repeatEveryType.value = 'week';
            days = document.querySelectorAll('.day');
            repeatOnResponse(days);
        };
        radioEndsNever.checked = true;
    }

    function showSetPopup() {
        if (radioEndsOn.checked === true) {
            elementsToEnable.push(inputEndsOn)
        } else if (radioEndsAfter.checked === true) {
            elementsToEnable.push(inputEndsAfter)
        }
    }

    if (redCircle.style.display === 'none') {
        resetRecurrencePopup();
    } else {
        showSetPopup();
    }
    elementsToEnable.forEach(element => element.disabled = false);
}

function closeRecurrencePopup(backdrop) {
    recurrence_popup.classList.remove('recurrence-box');
    recurrence_popup.classList.add('recurrence-box-hidden');
    backdrop.style.display = 'none';
    elementsToDisable = [repeatEveryType, repeatEveryInput, recurrenceCancelButton, recurrenceDoneButton, inputEndsAfter,
    inputEndsOn]
    elementsToDisable.forEach(element => element.disabled = true);
}

function recurrencePopupProcess(backdrop) {
    var top = calendarElement.clientHeight/2;
    var left = calendarElement.clientWidth/2 - 200;

    // Position the popup and show it
    recurrence_popup.style.top = `${top}px`;
    recurrence_popup.style.left = `${left}px`;
    recurrence_popup.style.zIndex = `200`;
    showRecurrencePopup(backdrop);
}

function toggleActiveClass(event) {
    event.target.classList.toggle('active');
    repeatOnMonth = event.target.id;
}

function repeatOnResponse(days){
    if (days) {
        Array.from(days).forEach(function(day) {
            day.addEventListener('click', toggleActiveClass);
        });
    }
}

function resetRepeatOn(days) {
    Array.from(days).forEach(function(day) {
        if (day.id === '1') {
            day.classList.add('active');
        } else {
            day.classList.remove('active');
        }
    });
}

function getActiveDays(days) {
    const activeDays = Array.from(days).map(element => element.id);
    return activeDays;
}

function getFirstDayOfWeek(date) {
    const day = date.getDay(); // Get current day of the week (0-6, Sunday to Saturday)
    const firstDay = new Date(date); // Copy the date to avoid mutating the original date
    firstDay.setDate(date.getDate() - day); // Subtract the day number to get to Sunday
    return firstDay;
}

function convertDateFormat(dateString) {
    const months = {
        January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9,
        November: 10, December: 11
    };
    const parts = dateString.split(' ');
    const month = months[parts[0]];
    const day = parseInt(parts[1].replace(',', ''), 10);
    const year = parseInt(parts[2], 10);

    const date = new Date(year, month, day);
    return date.toString();
}

function setTimeLimit(startTime, limitTime, timeType) {
    const startDate = new Date(startTime);
    var endDate = new Date(startTime);
    if (limitTime.includes('occurrences')) {
        endDate = '';
    } else if (limitTime) {
        endDate = convertDateFormat(limitTime);
    } else {
        if (timeType == 'day'){
            var years = 2
        } else if (timeType == 'month' || timeType == 'years') {
            var years = 20
        } else if (timeType == 'week') {
            var years = 5
        }
        endDate.setFullYear(startDate.getFullYear() + years); // Ten years later
    }
    const events = [];
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    let currentDate = new Date(startDate);
    return { currentDate, startDate, endDate, dayMilliseconds, events };
}


function getWeekEventDates(skipNumber, includeDays, currentDate, startDate, endTime, dayMilliseconds, events) {
    function createNewEvent(currentDatePointer) {
        const startEventTime = new Date(currentDatePointer);
        startEventTime.setHours(startDate.getHours(), startDate.getMinutes());

        const endEventTime = new Date(currentDatePointer);
        endEventTime.setHours(endTime.getHours(), endTime.getMinutes());

        events.push([
            startEventTime,
            endEventTime
        ]);
    }

    let weekStartDate = getFirstDayOfWeek(currentDate)
    let currentDatePointer = new Date(weekStartDate.getTime());
    for (let counter = 0; counter < 7; counter++) {
        if (includeDays.includes(currentDatePointer.getDay().toString())) {
            createNewEvent(currentDatePointer);
        }
        currentDatePointer = new Date(currentDatePointer.getTime() + dayMilliseconds);
    }
    currentDate = new Date(currentDate.getTime() + dayMilliseconds * 7 * skipNumber);

    return currentDate
}

function getEventDates(timeType, skipNumber, currentDate, startDate, endTime, dayMilliseconds, events) {
    const startEventTime = new Date(currentDate);
    startEventTime.setHours(startDate.getHours(), startDate.getMinutes());

    const endEventTime = new Date(currentDate);
    endEventTime.setHours(endTime.getHours(), endTime.getMinutes());

    events.push([
        startEventTime,
        endEventTime
    ]);
    switch (timeType) {
        case 'day':
            currentDate = new Date(currentDate.getTime() + dayMilliseconds * skipNumber);
            break;
        case 'month':
            currentDate.setMonth(currentDate.getMonth() + Number(skipNumber));
            break;
        case 'year':
            currentDate.setFullYear(currentDate.getFullYear() + Number(skipNumber));
            break;
    }
    return currentDate
}

function generateWeekEventDates(skipNumber, timeType, includeDays, startTime, endTime, limitTime) {
    var {currentDate, startDate, endDate, dayMilliseconds, events} = setTimeLimit(startTime, limitTime, timeType)

    if (endDate) {
        endDate = new Date(endDate);
        while (currentDate.getTime() < endDate.getTime()) {
            currentDate = getWeekEventDates(skipNumber, includeDays, currentDate, startDate, endTime, dayMilliseconds, events);
        }
    } else {
        const number = parseInt(limitTime, 10);
        for (let counter = 0; counter < number; counter++) {
            currentDate = getWeekEventDates(skipNumber, includeDays, currentDate, startDate, endTime, dayMilliseconds, events);
        }
    }
    return events;
}

function generateEventDates(skipNumber, timeType, startTime, endTime, limitTime) {
    var {currentDate, startDate, endDate, dayMilliseconds, events} = setTimeLimit(startTime, limitTime, timeType)

    if (endDate) {
        endDate = new Date(endDate);
        while (currentDate.getTime() < endDate.getTime()) {
            currentDate = getEventDates(timeType, skipNumber, currentDate, startDate, endTime, dayMilliseconds, events);
        }
    } else {
        const number = parseInt(limitTime, 10);
        for (let counter = 0; counter < number; counter++) {
            currentDate = getEventDates(timeType, skipNumber, currentDate, startDate, endTime, dayMilliseconds, events);
        }
    }
    return events;
}


function removeDaysOfWeek(element) {
    if (element) {
        element.remove();
    }
}

function addDaysOfWeek(parentElement) {
    var daysOfWeekHtml = `
        <label id="label-days-of-week">Repeat on</label>
        <div class="days-of-week">
            <div id="0" class="day">S</div>
            <div id="1" class="day active">M</div>
            <div id="2" class="day">T</div>
            <div id="3" class="day">W</div>
            <div id="4" class="day">T</div>
            <div id="5" class="day">F</div>
            <div id="6" class="day">S</div>
        </div>
    `;
    var container = document.createElement("div");
    container.innerHTML = daysOfWeekHtml;
    parentElement.appendChild(container);
    return parentElement;
}

window.addEventListener('dateSelected', function(e) {
    const selectedDate = e.detail.date;
    if (document.activeElement === eventDate) {
        eventDate.value = formatDateToUserFriendly(selectedDate);
        eventDate.blur();
    } else if (document.activeElement === inputEndsOn) {
        new_ends_on = selectedDate;
        inputEndsOn.value = formatDateToUserFriendly(selectedDate);
        inputEndsOn.blur();
    }
})

function updateEvent(newStartTime, newEndTime) {
    var event = {
        title: 'Do not disturb',
        start: newStartTime,
        end: newEndTime,
        backgroundColor: 'green',
        borderColor: 'green'
    };
    if (new_event) {
        new_event.remove();
        new_event = calendar.addEvent(event);
    } else if (clickedEvent) {
        oldClickedEvent = clickedEvent
        clickedEvent.remove();
        clickedEvent = calendar.addEvent(event);
    }
    calendar.gotoDate(newStartTime);
}

function concatenateDateTime(dateString, timeString) {
    // Convert the date string into a Date object
    var date = new Date(dateString);

    // Extract hours and minutes from the time string
    var timeParts = timeString.match(/(\d+):(\d+)(am|pm)/);
    var hours = parseInt(timeParts[1], 10);
    var minutes = parseInt(timeParts[2], 10);

    // Convert hours to 24-hour format if needed
    if (timeParts[3] === "pm" && hours < 12) {
        hours += 12;
    } else if (timeParts[3] === "am" && hours === 12) {
        hours = 0;
    }
    // Set the hours and minutes to the date
    date.setHours(hours, minutes);
    return date;
}

function isValidTimeFormat(inputString) {
    // Regular expression to match the format "HH:MMam" or "HH:MMpm"
    var regex = /^(1[0-2]|0?[1-9]):([0-5][0-9])([ap]m)$/i;
    return regex.test(inputString);
}

function isValidDateFormat(inputString) {
    // Regular expression to match the format "Month DD, YYYY"
    var regex = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s\d{1,2},\s\d{4}$/;
    if (!regex.test(inputString)) {
        return false; // Does not match the format
    }
    var date = new Date(inputString);
    if (isNaN(date.getTime())) {
        return false; // Not a valid date
    }
    var parts = inputString.split(/[\s,]+/);
    var month = parts[0];
    var day = parseInt(parts[1], 10);
    var year = parseInt(parts[2], 10);
    var reconstructedDateString = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return reconstructedDateString === `${month} ${day}, ${year}`;
}

function isTimeLessThan(firstInput, secondInput) {
    // Convert time to 24-hour format, correctly handling inputs without a space before am/pm
    function convertTo24Hour(timeStr) {
        // Adjusting to capture the modifier directly connected to the time
        let [time, modifier] = timeStr.match(/(\d+:\d+)(am|pm)/i).slice(1);
        let [hours, minutes] = time.split(':');

        if (hours === '12') {
            hours = '00';
        }

        if (modifier.toLowerCase() === 'pm') {
            hours = parseInt(hours, 10) + 12;
        }

        return parseInt(hours) * 60 + parseInt(minutes);
    }
    const firstTime = convertTo24Hour(firstInput);
    const secondTime = convertTo24Hour(secondInput);

    // Compare the two times
    return firstTime < secondTime;
}

function getTodayDate() {
    var today = new Date();
    var dateString = today.toDateString(); // "Wed Feb 28 2024"
    var midnight = "00:00:00";
    var timezoneOffset = -today.getTimezoneOffset() / 60;
    var timezone = "GMT" + (timezoneOffset >= 0 ? "+" : "") + timezoneOffset.toString().padStart(2, '0') + "00";
    var fullDateString = `${dateString} ${midnight} ${timezone} (Eastern European Standard Time)`;
    return fullDateString;
}

function showUndoPopup(info) {
    console.log(info)
    setTimeout(function() {
        if (info == 'save') {
            undoPopupText.textContent = 'Event saved';
        } else if (info == 'delete') {
            undoPopupText.textContent = 'Event deleted';
        } else {
            undoPopupText.textContent = 'Event updated';
        }
    }, 200);
    newInfo = info;

    function resetAndShowPopup() {
        clearTimeout(hidePopupTimeout);
        clearTimeout(showPopupDelayTimeout);

        var left = window.innerWidth / 2 - 50;
        var top = window.innerHeight - 70;
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        popup.style.display = 'block';
        popup.style.opacity = '1';

        hidePopupTimeout = setTimeout(function() {
            hideUndoPopup();
        }, 10000);
    }

    if (hidePopupTimeout) {
        hideUndoPopup();
        showPopupDelayTimeout = setTimeout(function() {
            resetAndShowPopup();
        }, 200);
    } else {
        resetAndShowPopup();
    }
}

function hideUndoPopup() {
    var top = calendarElement.clientHeight - 20;
    popup.style.top = `${top}px`;
    popup.style.opacity = '0';
    setTimeout(function() {
        popup.style.display = 'none';
    }, 200);

}

function removeClickedEvent() {
    if (clickedEvent && new_event) {
        console.log('there is clicked and new events')
    } else if (clickedEvent) {
        clickedEvent.remove();
        clickedEvent = '';
    }
}

function handleSave() {
    removeClickedEvent();
    changed_events.forEach(function(changed_event) {
        console.log("changed_event: ", changed_event)
        if (changed_event) {
            changed_event.remove();
        }
    })
    hideEventPopup();
}

function handleDelete() {
    function areObjectsEqual(obj1, obj2) {
        // Assuming we're only comparing specific properties, not methods
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        // Quick property length check
        if (keys1.length !== keys2.length) return false;

        // Check each property's value
        for (const key of keys1) {
            if (obj1[key] !== obj2[key]) return false;
        }

        return true;
    }

    function areSublistsEqual(sublist1, sublist2) {
        if (sublist1.length !== sublist2.length) return false;

        for (let i = 0; i < sublist1.length; i++) {
            if (!areObjectsEqual(sublist1[i], sublist2[i])) return false;
        }

        return true;
    }

    function removeDuplicateSublists(listOfSublists) {
        return listOfSublists.reduce((acc, currentSublist) => {
            const duplicateFound = acc.some(sublist => areSublistsEqual(sublist, currentSublist));
            if (!duplicateFound) acc.push(currentSublist);
            return acc;
        }, []);
    }

    function updateSublist(allChangedElements, changed_elements) {
      // Convert the input list to a Set for efficient element existence checks
      const changedElementsSet = new Set(changed_elements);

      // Find the index of the sublist to be updated
      const indexToUpdate = allChangedElements.findIndex(sublist =>
        sublist.every(element => changedElementsSet.has(element)) &&
        sublist.length < changed_elements.length
      );

      // If a matching sublist is found, replace it with the new list
      if (indexToUpdate !== -1) {
            allChangedElements[indexToUpdate] = changed_elements;
      }

      return allChangedElements;
    }

    if (clickedEvent) {
        changed_events.push(clickedEvent);
    }
    changed_events.forEach(function(changed_event) {
        calendar.addEvent(changed_event);
    })
    updateSublist(allChangedEvents, changed_events);
    allChangedEvents.push(changed_events);
    allChangedEvents = removeDuplicateSublists(allChangedEvents);
    hideEventPopup();
}

document.getElementById('undoButton').addEventListener('click', function() {
    function handleUpdate() {
        clickedEvent.remove();
        calendar.addEvent(oldClickedEvent);
        calendar.gotoDate(oldClickedEvent.start);
        clickedEvent = '';
        oldClickedEvent = '';
        hideEventPopup();
    }

    function handleRevert() {
        newInfo.revert();
        removeClickedEvent();
        hideEventPopup();
    }

    hideContextMenuPopup();
    if (newInfo == 'save') {
        handleSave();
    } else if (newInfo == 'delete') {
        handleDelete();
    } else if (newInfo == 'update') {
        handleUpdate();
    } else {
        handleRevert();
    }
    if (recurrent_events && recurrent_events.length > 0) {
        showDiscardPopup();
    } else {
        hideUndoPopup();
        if (new_event) {
            new_event.remove();
            new_event = '';
        }
    }
});

document.getElementById('closePopup').addEventListener('click', function() {
    hideUndoPopup();
});

function showRedCircle() {
    var redCircle = document.getElementById('red-circle');
    redCircle.style.display = 'block';
}

function hideRedCircle() {
    var redCircle = document.getElementById('red-circle');
    redCircle.style.display = 'none';
}

function getEventStartEndTimes() {
    if (new_event) {
        var startTime = new_event.start;
        var endTime = new_event.end;
    } else if (clickedEvent) {
        var startTime = new Date(clickedEvent.start);
        var endTime = new Date(clickedEvent.end);
    }
    return {startTime, endTime}
}

function getLimitTime() {
    if (radioEndsOn.checked) {
        limitTime = inputEndsOn.value;
    } else if (radioEndsAfter.checked) {
        limitTime = inputEndsAfter.value + ' occurrences';
    } else {
        limitTime = '';
    }
    return limitTime;
}

function getRecurrentEvents() {
    var activeDays = document.querySelectorAll('.day.active');
    var includeDays = getActiveDays(activeDays);
    var timeType = repeatEveryType.value;
    var skipNumber = repeatEveryInput.value;
    const {startTime, endTime} = getEventStartEndTimes();
    const limitTime = getLimitTime();

    if (timeType == 'week') {
        recurrent_events = generateWeekEventDates(skipNumber, timeType, includeDays, startTime, endTime, limitTime);
    } else {
        recurrent_events = generateEventDates(skipNumber, timeType, startTime, endTime, limitTime)
    }
    console.log("Events: ", recurrent_events.slice(0, 10));
}

[repeatEveryInput, inputEndsAfter].forEach(function(element) {
  element.addEventListener('input', function() {
    var value = parseInt(this.value, 10);
    if (value < 1) {
      this.value = 1;
    } else if (value > 99) {
      this.value = 99;
    }
  });
});

function handleElementFocus(element) {
    var rect = element.getBoundingClientRect()
    var top = rect.top - 100;
    var left = rect.left - 115;
    customCalendarPopup.style.top = `${top + element.offsetHeight}px`;
    customCalendarPopup.style.left = `${left}px`;
    customCalendarPopup.classList.remove('hidden');
}

inputEndsOn.addEventListener('focus', function() {
     handleElementFocus(inputEndsOn);
})

inputEndsOn.addEventListener('blur', function() {
    customCalendarPopup.classList.add('hidden');
    var is_date_valid = isValidDateFormat(inputEndsOn.value);
    if (!is_date_valid) {
        inputEndsOn.value = formatDateToUserFriendly(new_ends_on)
    }
})

function updateDisabledStates() {
    inputEndsOn.disabled = !radioEndsOn.checked;
    inputEndsAfter.disabled = !radioEndsAfter.checked;
}

[radioEndsNever, radioEndsOn, radioEndsAfter].forEach(radio => {
    radio.addEventListener('change', updateDisabledStates);
});

repeatEveryType.addEventListener('change', function() {
    function handleRepeatEveryWeek() {
        parentElement = addDaysOfWeek(parentElement);
        days = document.querySelectorAll('.day');
        repeatOnResponse(days);
    }

    function handleRepeatAllExceptFromWeek() {
        var daysElem = document.querySelector(".days-of-week");
        var labelDays = document.getElementById("label-days-of-week");
        if (daysElem && labelDays){
            daysElem.remove();
            labelDays.remove();
        }
    }

    if (repeatEveryType.value == 'week') {
        handleRepeatEveryWeek();
    } else {
        handleRepeatAllExceptFromWeek();
    }
})

backdrop.onclick = function(event) {
  if (event.target === backdrop) {
    closeRecurrencePopup(backdrop);
    hideDiscardPopup();
    hideDeleteRecurringEventPopup();
  }
}

recurrenceCancelButton.onclick = function() {
    changed_events = [];
    recurrent_events = [];
    closeRecurrencePopup(backdrop);
    hideRedCircle();
    console.log(recurrent_events);
}

recurrenceDoneButton.onclick = function() {
    getRecurrentEvents();
    toggleMoreSaveButtons();
    closeRecurrencePopup(backdrop);
    // Disable calendar editability
//    if (recurrent_events && recurrent_events.length > 0) {
//        calendar.setOption('editable', false);
//        if (new_event) {
//            new_event.editable = true;
//        } else if (clickedEvent) {
//            clickedEvent.editable = true;
//        }
//    }

}

eventDate.addEventListener('focus', function() {
    handleElementFocus(eventDate);
})

function getEventNewStartEndTime() {
    var newDate = new Date(convertDateFormat(eventDate.value));
    var newStartTime = concatenateDateTime(newDate, eventStartTime.value);
    var newEndTime = concatenateDateTime(newDate, eventEndTime.value);

    return {newStartTime, newEndTime}
}

function handleUpdateEvent() {
    if (new_event) {
        var oldStartTime = new_event.start;
        var oldEndTime = new_event.end;
    } else if (clickedEvent) {
        var oldStartTime = clickedEvent.start;
        var oldEndTime = clickedEvent.end;
    }

    const {newStartTime, newEndTime} = getEventNewStartEndTime()
    if (oldStartTime.getTime() !== newStartTime.getTime() || oldEndTime.getTime() !== newEndTime.getTime()) {
        updateEvent(newStartTime, newEndTime)
        if (clickedEvent) {
            showUndoPopup("update");
        }
    }
}

eventDate.addEventListener('blur', function() {
    customCalendarPopup.classList.add('hidden');
    var is_date_valid = isValidDateFormat(eventDate.value);
    if (is_date_valid) {
        handleUpdateEvent();
    } else {
        if (new_event) {
            eventDate.value = formatDateToUserFriendly(new_event.start)
        } else if (clickedEvent) {
            eventDate.value = formatDateToUserFriendly(clickedEvent.start)
        }
        console.log('invalid date format!')
    }
});

function updateEventFormInputElement(inputElement){
    function updateInputElFromNewEvent(inputElement) {
        if (inputElement == eventStartTime) {
            inputElement.value = formatAMPM(new_event.start);
        } else if (inputElement == eventEndTime) {
            inputElement.value = formatAMPM(new_event.end);
        }
    }

    function updateInputElFromClickedEvent(inputElement) {
        if (inputElement == eventStartTime) {
            inputElement.value = formatAMPM(clickedEvent.start);
        } else if (inputElement == eventEndTime) {
            inputElement.value = formatAMPM(clickedEvent.end);
        }
    }

    var flag = isValidTimeFormat(inputElement.value)
    flag = flag === true ? isTimeLessThan(eventStartTime.value, eventEndTime.value) : false;
    if (flag) {
        handleUpdateEvent(inputElement);
    } else {
        if (new_event) {
            updateInputElFromNewEvent(inputElement);
        } else if (clickedEvent) {
            updateInputElFromClickedEvent(inputElement);
        }
        console.log('invalid date format!')
    }
}

eventStartTime.addEventListener('blur', function() {
    updateEventFormInputElement(eventStartTime);
});

eventEndTime.addEventListener('blur', function() {
    updateEventFormInputElement(eventEndTime);
});

function datesEqual(a, b) {
    return a.getTime() === b.getTime();
}

function recurrentDateBigger(a, b) {
    return a.getTime() > b.getTime();
}

function clearAndCloseEventPopup() {
    showUndoPopup('save');
    hideEventPopup();
    clickedEvent = new_event;
    new_event = '';
    recurrent_events = [];
    hideRedCircle();
}

function createRecurrentEvents(existingEvents) {
    // Check if there is an existing event with the same start and end times
    function isExistingEventFunc(event, start, end) {
        var eventStart = new Date(event.start);
        var eventEnd = new Date(event.end);
        return datesEqual(eventStart, start) && datesEqual(eventEnd, end);
    }

    function recurrentDateBigger(a, b) {
        return a.getTime() >= b.getTime();
    }

    function getStartEvent() {
        if (clickedEvent) {
            var startEvent = new Date(clickedEvent.start);
        } else if (new_event) {
            var startEvent = new Date(new_event.start);
        }
        return startEvent;
    }

    function getEvent() {
        if (clickedEvent) {
            var event = clickedEvent;
        } else if (new_event) {
            var event = new_event;
        }
        return event;
    }

    function handleCreateRecurrentEvent(element) {
        recurrent_event = {
            title: 'Do not disturb',
            start: element[0],
            end: element[1],
            backgroundColor: 'green',
            borderColor: 'green'
        };
        var new_recurrent_event = calendar.addEvent(recurrent_event);
        changed_events.push(new_recurrent_event);
    }

    var startEvent = getStartEvent();
    getRecurrentEvents();
    recurrent_events.forEach(function(element) {
        var isExistingEvent = existingEvents.some(event => isExistingEventFunc(event, element[0], element[1]));
        var isBiggerThenStartEvent = recurrentDateBigger(element[0], startEvent)
        if (isExistingEvent || !isBiggerThenStartEvent) {
            console.log("An event with the same start and end times already exists or it is less then start event.");
        } else {
            handleCreateRecurrentEvent(element);
        }
    })
    var event = getEvent();
    changed_events.push(event);
    allChangedEvents.push(changed_events);
}

save.addEventListener('click', function() {
    changed_events = [];
    var existingEvents = calendar.getEvents();
    if (recurrent_events && recurrent_events.length > 0) {
        createRecurrentEvents(existingEvents);
    } else {
        changed_events.push(new_event);
    }
    clearAndCloseEventPopup();
});

recurrenceButton.addEventListener('click', function() {
    recurrencePopupProcess(backdrop);
});

moreOptionsButton.addEventListener('click', function() {
    recurrencePopupProcess(backdrop);
});



let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();

const day = document.querySelector(".calendar-dates");
const currdate = document.querySelector(".calendar-current-date");
const prenexIcons = document.querySelectorAll(".calendar-navigation span");

// Array of month names
const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];

function handleDaysClick(dayone, lastdate, dayend, monthlastdate, lit) {
    const handleDayClick = (dayElement, index) => {
		// Update the date variable with the clicked day
		let day_index = index - dayone;
		date = new Date(year, month, day_index+1);
		const event = new CustomEvent('dateSelected', {detail: {date: date}});
	    window.dispatchEvent(event);
	}
	return handleDayClick
}

// Function to generate the calendar
const calendar_manipulate = () => {
    let dayone = new Date(year, month, 1).getDay();
    let lastdate = new Date(year, month + 1, 0).getDate();
    let dayend = new Date(year, month, lastdate).getDay();
    let monthlastdate = new Date(year, month, 0).getDate();
    let lit = "";

    // Days from the previous month
    for (let i = dayone; i > 0; i--) {
        lit += `<li class="inactive">${monthlastdate - i + 1}</li>`;
    }
    // Current month days
    for (let i = 1; i <= lastdate; i++) {
        let isToday = i === date.getDate() && month === new Date().getMonth() && year === new Date().getFullYear() ? "active" : "";
        lit += `<li class="${isToday}">${i}</li>`;
    }

    // Next month days to fill the row
    for (let i = 1; i <= 6 - dayend; i++) {
        lit += `<li class="inactive">${i}</li>`;
    }

    // Calculate total displayed days and adjust for an additional row if needed
    let totalDisplayedDays = dayone + lastdate + (6 - dayend);
    if (totalDisplayedDays / 7 <= 5) { // If total rows are 5 or less, add another row
        for (let i = 6 - dayend + 1; i <= 6 - dayend + 7; i++) {
            lit += `<li class="inactive">${i}</li>`;
        }
    }

    currdate.innerText = `${months[month]} ${year}`;
    day.innerHTML = lit;

    const days = document.querySelectorAll(".calendar-dates li");
    handleDayClick = handleDaysClick(dayone, lastdate, dayend, monthlastdate, lit);

    days.forEach((dayElement, index) => {
        dayElement.addEventListener("click", function(event) {
            event.preventDefault();
            handleDayClick(dayElement, index);
        });
    });
}

calendar_manipulate();

// Attach a click event listener to each icon
prenexIcons.forEach(icon => {
	// When an icon is clicked
	icon.addEventListener("click", () => {
		// Check if the icon is "calendar-prev"
		// or "calendar-next"
		month = icon.id === "calendar-prev" ? month - 1 : month + 1;
		// Check if the month is out of range
		if (month < 0 || month > 11) {
			// Set the date to the first day of the
			// month with the new year
			date = new Date(year, month, new Date().getDate());
			// Set the year to the new year
			year = date.getFullYear();
			// Set the month to the new month
			month = date.getMonth();
		}

		else {
			// Set the date to the current date
			date = new Date();
		}

		// Call the manipulate function to
		// update the calendar display
		calendar_manipulate();
	});
});
