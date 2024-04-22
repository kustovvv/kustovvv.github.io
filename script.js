var googleCalendarEvents;
var googleCalendarEventsFullBlocked;
var tg = window.Telegram.WebApp;
var chatId;

let events = [];
var allCalendarEvents = {}

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
var eventSummary = document.getElementById('event-summary');
var closeIcon = document.getElementById('close-icon');
var trash = document.getElementById('delete-event-trash');
var save = document.getElementById('event-save');
var eventDate = document.getElementById('event-date');
var eventStartTime = document.getElementById('event-start');
var eventDateEnd = document.getElementById('event-date-end');
var eventEndTime = document.getElementById('event-end');
var recurrenceButton = document.getElementById('recurrence-button');
var moreOptionsButton = document.getElementById('event-more-options');
var dragHandle = document.getElementById('drag-handle');
makeDraggable(event_popup, dragHandle);
var eventStartEnd = document.getElementById('event-start-end');
var minusSymbol = document.getElementById('minus-symbol');

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
var timePicker = document.getElementById('timePicker');

var allChangedEvents = [];

var hasIntersectionsFlag = false;
var dragAllDay = false;
var undoElement;
let updateFromInput = false;
var oldEvent;
var eventSpanMultipleDays = false;

// Show contextMenuPopup element.
function showContextMenuPopup() {
    contextMenuPopup.classList.remove('recurrence-box-hidden');
    contextMenuPopup.classList.add('recurrence-box');
}

// Hide contextMenuPopup element.
function hideContextMenuPopup() {
    contextMenuPopup.classList.remove('recurrence-box');
    contextMenuPopup.classList.add('recurrence-box-hidden');
}

// Attach a click event listener to the deleteAllEvents element.
deleteAllEvents.addEventListener('click', function() {
    radioDeleteAllEvents.checked = true;
})

// Attach a click event listener to the deleteThisEvent element.
deleteThisEvent.addEventListener('click', function() {
    radioDeleteThisEvent.checked = true;
})

// Attach a mousedown event listener to the customCalendarPopup element.
customCalendarPopup.addEventListener('mousedown', function(event) {
    event.preventDefault();
});

/**
 * Checks if the currently clicked event is part of any lists of changed recurrent events. If the clicked event matches
 * the start time of any event in the lists of changed recurrent events, those lists are returned. Otherwise, an empty
 * array is returned, indicating that the clicked event is not part of any recurrent event series.
 *
 * @global allChangedEvents - The collection of lists, each representing changed events for a recurring series.
 * @global clickedEvent - The event that was clicked on, potentially triggering the deletion process.
 * @returns {Array} - A list of event lists containing the clicked event if it is recurrent, otherwise an empty array.
 */
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

/**
 * Initiates the process of deleting events, distinguishing between single and recurrent events. First, it checks if the
 * event to be deleted is part of a recurring series. If it is, it shows a popup to confirm the deletion of recurrent events.
 * If not, and there is a clicked event, it clears the list of changed events, adds the clicked event to this list for deletion,
 * removes the event from the UI, and then hides the event popup.
 *
 * @global changed_events - The list of individual or recurring events that have been modified.
 */
function processDeleteEvents() {
    var filteredRecurrentList = isInRecurrentEvents();
    changed_events = filteredRecurrentList[0];
    if (filteredRecurrentList && filteredRecurrentList.length > 0) {
        showDeleteRecurringEventPopup();
        undoElement = clickedEvent;
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

// Attach a click event listener to the trash element.
trash.addEventListener('click', function() {
    processDeleteEvents();
});

/**
 * Handles the deletion of a single event instance from both the individual event list and the collection of lists
 * for recurring events. It filters out the clicked event based on the start time from `changed_events` and each list
 * within `allChangedEvents`. For non-all-day events, it also matches the end time. After filtering, if the clicked event
 * exists, it is removed from the calendar UI.
 *
 * @global changed_events - The list of individual events that have been modified.
 * @global allChangedEvents - The collection of lists, each representing changed events for a recurring event.
 */
function handleDeleteSingleEvent() {
    if (clickedEvent) {
        changed_events = changed_events.filter(event => event.start.getTime() !== clickedEvent.start.getTime())
        allChangedEvents = allChangedEvents.map(list_changed_events => list_changed_events.filter(event =>
                !(event.start.getTime() === clickedEvent.start.getTime())))

        if (!clickedEvent.allDay) {
            changed_events = changed_events.filter(event => event.end.getTime() !== clickedEvent.end.getTime())
            allChangedEvents = allChangedEvents.map(list_changed_events => list_changed_events.filter(function(event) {
                if (!event.allDay) {
                    return !(event.end.getTime() === clickedEvent.end.getTime())
                }
            }))
        }

        clickedEvent.remove();
    }
}

/**
 * Deletes all instances of a recurring event from the calendar UI based on the start time, and optionally the end time
 * if the event is not marked as an all-day event.
 *
 * @global allChangedEvents - The collection of the lists of events that is part of any recurrence user created.
 */
function handleDeleteAllEvents() {
    allChangedEvents = allChangedEvents.filter(list_changed_events => !list_changed_events.some(event =>
    event.start.getTime() === clickedEvent.start.getTime()));
    if (!clickedEvent.allDay) {
        allChangedEvents = allChangedEvents.filter(list_changed_events => !list_changed_events.some(function(event) {
            if (!event.allDay) {
                return event.end.getTime() === clickedEvent.end.getTime()
            }
        }));
    }
    handleSave();
}

/**
 * Attaches a click event listener to the confirmDelete element. When clicked, it checks which delete option is selected
 * (delete this event or delete all events) and calls the appropriate function to handle the deletion. After performing
 * the deletion, it hides the event popup, displays an undo popup allowing the user to reverse the delete action, and
 * hides the popup for deleting recurring events.
 */
confirmDelete.addEventListener('click', function() {
    if (radioDeleteThisEvent.checked) {
        handleDeleteSingleEvent();
    } else if (radioDeleteAllEvents.checked) {
        handleDeleteAllEvents();
    }
    hideEventPopup();
    showUndoPopup('delete');
    hideDeleteRecurringEventPopup();
})

// Attach a click event listener to the cancelDelete element.
cancelDelete.addEventListener('click', function() {
    hideDeleteRecurringEventPopup();
})

// Hide deleteRecurringEventPopup element.
function hideDeleteRecurringEventPopup() {
    deleteRecurringEventPopup.classList.remove('recurrence-box')
    deleteRecurringEventPopup.classList.add('recurrence-box-hidden')
    backdrop.style.display = 'none';
}

/**
 * Displays the deleteRecurringEvent popup and adjust it based on the properties of the clicked event(calendarElement).
 * It ensures the popup is visible by adjusting its class list.
 *
 * @global calendarElement - The existing calendar event that is currently clicked.
 */
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

// Attach a click event listener to the closeIcon element.
closeIcon.addEventListener('click', function() {
    if (recurrent_events && recurrent_events.length > 0) {
        showDiscardPopup();
    } else {
        recurrent_events = [];
        closeActiveWindows();
    }
})

// Hide discard popup element.
function hideDiscardPopup() {
    discardPopup.classList.remove('recurrence-box')
    discardPopup.classList.add('recurrence-box-hidden')
    backdrop.style.display = 'none';
}

// Show discard popup element and display it centered on screen.
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

// Attach a click event listener to the cancelDiscard element.
cancelDiscard.addEventListener('click', function() {
    hideDiscardPopup();
    clickedEvent = '';
    calendar.addEvent(new_event);
    showEventPopup();
})

/**
 * Attaches a click event listener to the 'confirmDiscard' element. When clicked, it clears the array holding recurrent events,
 * removes the newly created event (if it exists), and resets the 'new_event' variable. Additionally, it triggers functions to
 * close any active windows, hide the red circle indicator, and hide the discard confirmation popup, effectively discarding
 * changes or new event additions.
 *
 * @global new_event - The newly created calendar event instance.
 * @global recurrent_events - The list of recurrent events.
 */
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

// Hide event popup element
function hideEventPopup() {
    event_popup.classList.remove('recurrence-box');
    event_popup.classList.add('recurrence-box-hidden');
}

/**
 * Enables drag functionality for an event popup using a designated handle. The element can be dragged across the screen,
 * with its position updating based on the mouse's movement. This function sets up the necessary event listeners on the
 * handle for 'mousedown', 'mousemove', and 'mouseup' events to manage the drag behavior, including calculating the offset
 * from the mouse position to maintain relative positioning and resetting event listeners once dragging is complete.
 *
 * @param {HTMLElement} element - The element to be made draggable.
 * @param {HTMLElement} handle - The element used as a drag handle for initiating the drag action.
 */
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

/**
 * Displays the event popup and adjusts its elements based on the properties of the clicked event. It ensures the popup is
 * visible by adjusting its class list. Additionally, it modifies the display and disabled state of various popup elements,
 * including trash and recurrence buttons, based on the event's `durationEditable` and `allDay` properties, as well as the
 * comparison of start and end dates. The summary of the event is also updated to reflect the title of the clicked event.
 *
 * @global clickedEvent - The existing calendar event that is currently clicked.
 */
function showEventPopup() {
    function adjustPopupEventIcons() {
        let style = 'block'
        let disabled = false
        if (clickedEvent.durationEditable == false) {
            style = 'none'
            disabled = true
        }
        trash.style.display = style
        recurrenceButton.style.display = style
        if (!clickedEvent.allDay && isDatePartDifferent(clickedEvent.start, clickedEvent.end)) {
            recurrenceButton.style.display = 'none';
        }

        const elements = [eventDate, eventStartTime, eventEndTime, eventDateEnd]
        elements.forEach(function(element) {
            element.disabled = disabled;
            element.style.color = 'black'
        })
        eventSummary.textContent = clickedEvent.title
    }
    event_popup.classList.remove('recurrence-box-hidden');
    event_popup.classList.add('recurrence-box');
    adjustWidth(eventDate);
    adjustWidth(eventDateEnd);
    if (clickedEvent) {
        adjustPopupEventIcons();
    }
}

// Hides the recurrence popup.
function hideRecurrencePopup() {
    recurrence_popup.classList.remove('recurrence-box');
    recurrence_popup.classList.add('recurrence-box-hidden');
}

// Add an event listener for the 'mousemove' event on the document.
document.addEventListener('mousemove', (e) => {
    lastKnownMousePosition.x = e.clientX;
    lastKnownMousePosition.y = e.clientY;
});

/**
 * Converts an ISO date string(2024-03-14T09:30:00+02:00) to a time string in 12-hour format with lowercase 'am' or 'pm'.
 *
 * @param {string} dateString - The ISO date string to be converted into a 12-hour format time string.
 * @returns {string} - The formatted time string in 12-hour format with 'am' or 'pm' in lowercase.
 */
function convertToAMPM(dateString) {
  // Parse the ISO string
  const date = new Date(dateString);

  // Format the time in AM/PM format
  const options = { hour: 'numeric', minute: 'numeric', hour12: true };
  const timeString = date.toLocaleTimeString('en-US', options);

  // Replace uppercase PM and AM with lowercase
  return timeString.replace(' PM', 'pm').replace(' AM', 'am');
}

/**
 * Formats a JavaScript Date object(Thu Mar 14 2024 08:30:00 GMT+0200 (Eastern European Standard Time)) into a string
 * representing the time in 12-hour format with AM/PM suffix.
 *
 * @param {Date} date - The Date object to be formatted into a time string.
 * @returns {string} - The time in the format of "hours:minutesAM/PM".
 */
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

/**
 * Formats a given date string into a more user-friendly date format.
 *
 * @param {string} inputDateString - The date string to be formatted.
 * @returns {string} - The formatted date in a user-friendly format.
 */
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

/**
 * Increases the time of a given date string by a specified number of hours and returns the new date.
 *
 * @param {string} inputDateString - The initial date in string format.
 * @param {number} hours - The number of hours to add to the date.
 * @returns {Date} - The new date with the added hours.
 */
function increaseDateTime(inputDateString, hours) {
    let date = new Date(inputDateString);
    let hoursToAdd = hours;
    date.setHours(date.getHours() + hoursToAdd);
    return date
}

/**
 * Positions and displays the event popup based on the click coordinates within the calendar. It adjusts the popup's
 * position to prevent it from extending outside the visible area of the calendar. For smaller screens, the positioning
 * logic is modified to ensure the popup remains visible within the constrained viewport.
 *
 * @param {number} x - The x-coordinate (horizontal position) of the event click.
 * @param {number} y - The y-coordinate (vertical position) of the event click.
 */
function showPopupOnEventClick(x, y) {
    hideContextMenuPopup();
    // Calculate the position for the popup.
    var x_left = x + 430 <= calendarElement.clientWidth ? x + 100 : x - 380;
    var left = x_left - 100 > 0 ? x_left : 100;
    var y_top = y + 150 <= calendarElement.clientHeight ? y : y - 100;
    var y_bottom = y_top >= 0 ? y_top : 150;
    if (calendarElement.clientWidth < 600) {
        left = calendarElement.clientWidth > 400 ? calendarElement.clientWidth*0.3 : calendarElement.clientWidth*0.1
        var y_top = y >= calendarElement.clientHeight*0.6 ? y - 200 : y + 50;
        var top = y_top >= 0 ? y_top : 160;
    } else {
        top = y_bottom
    }

    // Position the popup and show it
    event_popup.style.top = `${top}px`;
    event_popup.style.left = `${left}px`;

    showEventPopup();
}

/**
 * Removes focus from the event date, start time, and end time input fields and hides the custom calendar popup
 * by adding a 'hidden' class to its class list.
 */
function clearBlur() {
    eventDate.blur();
    eventStartTime.blur();
    eventEndTime.blur();
    customCalendarPopup.classList.add('hidden');
}

/**
 * Constructs and returns an event instance object with predefined properties such as title, start and end times, colors,
 * and editability of duration. This object is used to represent an event in the calendar.
 *
 * @param {string} startT - The start time of the event.
 * @param {string} endT - The end time of the event.
 * @returns {Object} - An object representing the event with specified start and end times, appearance settings, and other
 * properties.
 */
function getEventInstance(startT, endT) {
    var eventInstance = {
        title: 'Do not disturb',
        start: startT,
        end: endT,
        backgroundColor: 'green',
        borderColor: 'green',
        durationEditable: true,
    }
    return eventInstance
}

/**
 * Creates and initializes a new calendar event based on specified information. It updates date and time input fields
 * with formatted values for non-all-day events, calculates an end time, adds the event to the calendar, and displays a
 * popup at the click location.
 *
 * @param {Object} info - Contains information about the event and details for popup positioning.
 * @global new_event - The newly created calendar event instance.
 */
function createEvent(info) {
    if (!info.allDay) {
        var endTime = increaseDateTime(info.dateStr, 1);
        let {dummyEndDate, adjustedEndDate} = getDummyAndAdjustedDates(info.dateStr)
        if (endTime.getTime() === dummyEndDate.getTime()) {
            endTime = adjustedEndDate;
        }
    }

    var newEvent = getEventInstance(info.dateStr, endTime)
    new_event = calendar.addEvent(newEvent);
    setTime(new_event);
    showTime();
    // Calculate the position for the popup.
    var x = info.jsEvent.clientX;
    var y = info.jsEvent.clientY;
    showPopupOnEventClick(x, y);
}

// This function makes the "more options" and "save" buttons visible by setting their display style to 'block'.
function showMoreSaveButtons() {
    moreOptionsButton.style.display = 'block';
    save.style.display = 'block';
}

/**
 * Toggles the visibility of additional save buttons and the red circle indicator based on the context of the event being
 * edited or created.
 */
function toggleMoreSaveButtons() {
    if (recurrent_events && recurrent_events.length > 0) {
        showRedCircle();
        showMoreSaveButtons();
    } else if (new_event) {
        showMoreSaveButtons();
    } else {
        // If there are no recurrent events and the current event isn't new, then hide red indicator and more/save buttons
        hideRedCircle();
        moreOptionsButton.style.display = 'none';
        save.style.display = 'none';
    }
}

/**
 * Closes all currently active windows or popups related to event creation, editing, or context menus, and cancels any
 * ongoing new event creation.
 *
 * @global new_event - The temporary event object for a new event being created. This is cleared if it exists.
 */
function closeActiveWindows() {
    hideEventPopup();
    hideRecurrencePopup();
    hideContextMenuPopup();
    if (new_event) {
        new_event.remove();
        new_event = '';
    }
}

/**
 * Handles actions when a date is clicked in the calendar. It determines the course of action based on the context, such
 * as whether to handle event recurrence, create a new event, or close active windows. Actions include clearing UI
 * elements, displaying more options, and managing visibility of UI components based on the presence of recurrent events
 * or active popups.
 *
 * @param {Object} info - Information about the clicked date.
 */
function onDateClick(info) {
    function handleRecurrence() {
        if (new_event) {
            new_event.remove();
        }
        createEvent(info);
    }

    function handleCreateEvent() {
        clickedEvent = '';
        trash.style.display = 'none';
        recurrenceButton.style.display = 'block';
        createEvent(info);
        eventSummary.textContent = 'Do not disturb';
    }

    clearBlur();
    moreOptionsButton.style.display = 'block';
    save.style.display = 'block';
    hideContextMenuPopup();
    var is_recurrence_active = recurrence_popup.classList.contains('recurrence-box');
    var is_event_active = event_popup.classList.contains('recurrence-box');


    if (info.allDay) {
        let times = resetTimes(info.dateStr, addOneHour(info.dateStr));
        var startTime = new Date(times.newStartTime)
        var endTime = new Date(times.newEndTime)
    } else {
        var startTime = new Date(info.dateStr);
        var endTime = new Date(addOneHour(info.dateStr));
    }

    if (recurrent_events && recurrent_events.length > 0) {
        if (checkOverlaps(startTime, endTime).length > 0) {
            alert("The event cannot be created because it has overlaps");
        } else {
            handleRecurrence();
        }
    } else if (is_recurrence_active || is_event_active) {
        closeActiveWindows();
    } else {
        if (checkOverlaps(startTime, endTime).length > 0) {
            alert("The event cannot be created because it has overlaps");
        } else {
            handleCreateEvent();
        }
    }
}

/**
 * Resets the start and end times of the provided date strings to midnight, with the end time additionally adjusted
 * to the midnight of the following day.
 *
 * @param {string} startTime - The date string representing the start time.
 * @param {string} endTime - The date string representing the end time.
 * @returns {Object} - An object containing the new start and end times as strings, both reset to midnight,
 * with the end time extended to the following day's midnight.
 */
function resetTimes(startTime, endTime) {
    // Parse the start and end time strings into Date objects
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Reset start time to 00:00:00
    start.setHours(0, 0, 0, 0);

    // Reset end time to 00:00:00 and add one day
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);

    // Return the updated dates as strings
    return {
        newStartTime: start.toString(),
        newEndTime: end.toString()
    };
}

/**
 * Calculates and returns the bounding coordinates of an event's element on the page, adjusted for any current window scrolling.

 * @param {Object} info - Contains information about the event, including the element (`el`) associated with the event.
 * @returns {Object} - An object containing the `x` and `y` coordinates for the position at which to show related UI elements.
 */
function getEventBoundingCords(info) {
    var elementRect = info.el.getBoundingClientRect();
    var x = elementRect.left + window.scrollX + 30;
    var y = elementRect.top + window.scrollY;
    return {x, y}
}

/**
 * Sets the start date and time of an event into their respective input elements with user-friendly formats.
 *
 * @param {Object} info - Information about the event, including its start and potentially its end time.
 * @param {Date} [endTime] - Optional. A specific end time to set for the event, overriding the event's original end time if provided.
 */
function setEventNewDateStartEndTime(info, endTime) {
    eventDate.value = formatDateToUserFriendly(info.event.start.toDateString());
    eventStartTime.value = formatAMPM(info.event.start);
    if (endTime) {
        eventEndTime.value = formatAMPM(endTime);
    } else {
        eventEndTime.value = formatAMPM(info.event.end);
    }
}

/**
 * Checks if the event currently being clicked is the same as the previously clicked event. This determination is based
 * on the comparison of their start and end times. For all-day events, it compares just the start dates assuming that
 * all-day events might not have specific end times.
 *
 * @param {Object} info - Contains information about the event currently being interacted with.
 * @returns {boolean} - True if the currently clicked event is the same as the previously clicked event; false otherwise.
 */
function isClickedOnTheSameEvent(info) {
    if (clickedEvent.allDay && info.event.allDay) {
        return clickedEvent.start == info.event.start
    } else {
        var startClickedEv = clickedEvent.start.getTime()
        var startInfoEv = info.event.start.getTime()
        var endClickedEv = startClickedEv;
        var endInfoEv = startInfoEv;
        if (clickedEvent.end) { endClickedEv = clickedEvent.end.getTime() }
        if (info.event.end) { endInfoEv = info.event.end.getTime() }
        return startClickedEv == startInfoEv && endClickedEv == endInfoEv
    }
}

/**
 * Determines if the date parts (year, month, day) of two given dates are different.
 *
 * @param {string|Date} firstDateStr - The first date in string format or as a Date object.
 * @param {string|Date} lastDateStr - The second date in string format or as a Date object.
 * @returns {boolean} - True if there is a difference in the year, month, or day components of the two dates; false otherwise.
 */
function isDatePartDifferent(firstDateStr, lastDateStr) {
    // Parse the date strings into Date objects
    const firstDate = new Date(firstDateStr);
    const lastDate = new Date(lastDateStr);

    // Extract the year, month, and day components of both dates
    const firstDateComponents = {
        year: firstDate.getFullYear(),
        month: firstDate.getMonth(),
        day: firstDate.getDate(),
    };
    const lastDateComponents = {
        year: lastDate.getFullYear(),
        month: lastDate.getMonth(),
        day: lastDate.getDate(),
    };

    // Compare the year, month, and day components of both dates
    return firstDateComponents.year !== lastDateComponents.year ||
           firstDateComponents.month !== lastDateComponents.month ||
           firstDateComponents.day !== lastDateComponents.day;
}

/**
 * Adjusts the UI to display first date and time inputs for the start and end of an event, while hiding the end date input.
 *
 * @global eventDate - The input element for the event's start date, made visible.
 * @global eventStartTime - The input element for the event's start time, made visible.
 * @global eventEndTime - The input element for the event's end time, made visible.
 * @global eventDateEnd - The input element for the event's end date, hidden in this context.
 */
function showFirstDayTimes() {
    let elements = [eventDate, eventStartTime, eventEndTime]
    elements.forEach(function(element){element.style.display = 'flex'})
    eventDateEnd.style.display = 'none';
}

/**
 * Displays both date and time input elements for events, suitable for events that have specific start and end times
 * within one or more days.
 *
 * @global eventDate - The input element for the event's start date.
 * @global eventStartTime - The input element for the event's start time.
 * @global eventEndTime - The input element for the event's end time.
 * @global eventDateEnd - The input element for the event's end date.
 */
function showDefaultDaysTimes() {
    let elements = [eventDate, eventStartTime, eventEndTime, eventDateEnd]
    elements.forEach(function(element){element.style.display = 'flex'})
    if (clickedEvent && clickedEvent.end) {
        eventDateEnd.value = formatDateToUserFriendly(clickedEvent.end.toDateString());
    } else if (new_event && new_event.end) {
        eventDateEnd.value = formatDateToUserFriendly(new_event.end.toDateString());
    }
}

/**
 * Updates the UI to display only the date inputs for an event, hiding the time inputs. This is used for all-day events.
 *
 * @global eventDate - The input element for the event's start date.
 * @global eventDateEnd - The input element for the event's end date.
 * @global eventStartTime - The input element for the event's start time, hidden in this context.
 * @global eventEndTime - The input element for the event's end time, hidden in this context.
 */
function showOnlyDays() {
    eventDate.style.display = 'flex';
    eventDateEnd.style.display = 'flex';
    eventStartTime.style.display = 'none';
    eventEndTime.style.display = 'none';
}

/**
 * Determines which time or date display function to call based on the state of the currently selected or newly created event.
 *
 * @global clickedEvent - The event currently selected by the user.
 * @global new_event - A newly created event that has not yet been saved.
 */
function showTime() {
    if (clickedEvent && clickedEvent.allDay === true || new_event && new_event.allDay === true) {
        showOnlyDays();
    } else if (clickedEvent && isDatePartDifferent(clickedEvent.start, clickedEvent.end) && !new_event) {
        showFirstDayTimes();
    } else {
        let event = getEvent();
        if (event) {
            let adjustedEndDate = new Date(event.start);
            adjustedEndDate.setHours(23, 59, 59, 999);
            showFirstDayTimes();
        }
    }
    toggleMoreSaveButtons();
}

/**
 * Calculates and returns a dummy end date based on a given input date and an increase value.

 * @param {Date|string} inputValue - The initial date value from which to calculate the dummy end date.
 * @param {number} increaseValue - The number of days to add to the adjusted end date to create the dummy end date.
 * @returns {Date} - The calculated dummy end date.
 */
function getDummyEndDate(inputValue, increaseValue) {
    // Adjust the end date to the end of the start date
    var adjustedEndDate = new Date(inputValue);
    adjustedEndDate.setHours(23, 59, 59, 999); // Set to the end of the start date
    var dummyEndDate = new Date(inputValue);
    dummyEndDate.setDate(adjustedEndDate.getDate() + increaseValue);
    dummyEndDate.setHours(0, 0, 0, 0); // Set time to 00:00:00.000

    return dummyEndDate
}

/**
 * Sets the start and end dates for an all-day event when the event is being edited.
 *
 * @param {Object} info - Contains information about the event being edited, including its start and potentially its end date.
 * @global eventDate - The input element for the event's start date.
 * @global eventDateEnd - The input element for the event's end date.
 */
function setEventNewDateStartEndDates(info) {
    if (info.event.end) {
        var dummyEndDate = getDummyEndDate(info.event.end, -1);
    } else {
        var dummyEndDate = info.event.start
    }
    eventDate.value = formatDateToUserFriendly(info.event.start.toDateString());
    eventDateEnd.value = formatDateToUserFriendly(dummyEndDate);
}

/**
 * Processes the clicked event and determines the visibility of popups based on the event's and popups' states. It calculates
 * the event's bounding coordinates for positioning the popup.
 *
 * @param {Object} info - Information about the event that was clicked, used to determine popup positioning.
 * @global recurrence_popup - The recurrence popup element.
 * @global event_popup - The event popup element.
 * @global new_event - Tracks the newly created event, if any.
 * @global clickedEvent - The event that was last clicked.
 */
function processEventAndPopup(info) {
    const {x, y} = getEventBoundingCords(info);
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
}

/**
 * Handles actions to perform when an event is clicked on the calendar.
 *
 * @param {Object} info - Contains information about the event that was clicked, including the event object itself.
 * @global {Object|null} clickedEvent - The last clicked event on the calendar. This function updates it to the currently
 * clicked event.
 * @global {Array} recurrent_events - A global array to track events marked for recurrence. This function may reset this array.
 */
function onEventClick(info) {
    clearBlur();
    if (clickedEvent) {
        if (!isClickedOnTheSameEvent(info)){
            recurrent_events = []
            hideRedCircle();
        }
    }

    clickedEvent = info.event;
    processEventAndPopup(info);
    setTime(info.event);
    showTime();
}

/**
 * Checks for overlaps between a given event time range and existing events on the calendar, excluding 'Do not disturb'
 * events and considering events that are duration editable.
 *
 * @param {Date} evStart - The start time of the current event being checked for overlaps.
 * @param {Date} evEnd - The end time of the current event being checked for overlaps.
 * @global {Object} calendar - The calendar instance from which to retrieve existing events.
 * @returns {Array} - An array of events that intersect with the time range of the given event, indicating overlaps.
 */
function checkOverlaps(evStart, evEnd) {
    var curEvent = {startTime: evStart, endTime: evEnd}
    let existingEvents = calendar.getEvents().filter(exEvent =>
        exEvent.start.getTime() !== curEvent.startTime.getTime() && exEvent.title !== 'Do not disturb' ||
        exEvent.end && exEvent.end.getTime() !== curEvent.endTime.getTime() && exEvent.title !== 'Do not disturb'||
        exEvent.start.getTime() === curEvent.startTime.getTime() &&
        exEvent.end && exEvent.end.getTime() === curEvent.endTime.getTime() &&
        exEvent.title !== 'Do not disturb' || exEvent.durationEditable);

    let intersectEvents = filterIntersectingRanges(curEvent, existingEvents)
    return intersectEvents
}

/**
 * Processes the dropping of an event on the calendar, adjusting the event's time or date based on whether it's marked as
 * an all-day event. It shows the current time, updates the event's start and/or end times if necessary, and optionally
 * displays a popup at the last known mouse position.
 *
 * @param {Object} info - Object containing information about the event being dropped, including whether it's an all-day event.
 * @param {Date} endTime - The end time to be assigned to the event if it doesn't already have one.
 * @param {boolean} flag - A flag indicating whether additional processing, such as an update, should be performed.
 * @global {Object} new_event - Globally tracks a newly created event.
 * @global {Object} clickedEvent - Globally tracks the event that was last clicked.
 * @global {Object} lastKnownMousePosition - Stores the last known mouse position with 'x' and 'y' properties.
 */
function processEventDrop(info, endTime, flag=true) {
    var x = lastKnownMousePosition.x
    var y = lastKnownMousePosition.y

    if (flag) {
        if (new_event) {
            new_event = info.event;
        }
    }

    if (clickedEvent) {
        undoElement = clickedEvent;
    }

    if (!clickedEvent && !new_event) {
        clickedEvent = info.event;
    }

    if (flag) {
        update(info);
    }
    if (eventSpanMultipleDays) {
        if (new_event) {
            new_event = oldEvent;
        } else if (clickedEvent) {
            clickedEvent = oldEvent;
        }
        eventSpanMultipleDays = false;
    } else {
        setTime(info.event);
        if (clickedEvent) {
            showUndoPopup(info);
        }
    }
    showTime();
    showPopupOnEventClick(x, y);
}

/**
 * Manages the dropping of an event after being dragged to a new time or date. It first ensures the event has an end time,
 * potentially adjusting it if missing. Then, it checks for event overlaps. If overlaps are detected, the user is alerted,
 * and the event is reverted to its original position. Otherwise, the event drop process is completed with potential updates.
 *
 * @param {Object} info - Information about the event being dropped, including start and end times.
 */
function handleEventDrop(info) {
    function handleOverlaps() {
        alert("The current event has overlaps");
        if (clickedEvent) {
            info.revert();
            if (dragAllDay) {
                undoElement.remove();
            }
        } else if (new_event) {
            new_event.remove();
            clickedEvent = '';
            undoElement = '';
            new_event = '';
            recurrent_events = []
            hideRedCircle();
            closeActiveWindows();
        }
        hideUndoPopup();
    }

    function handleOverlaps2(flag) {
        var start = info.event.start
        if (info.event.allDay) {
            let times = resetTimes(start, addOneHour(start));
            var startTime = new Date(times.newStartTime)
            var endTime = new Date(times.newEndTime)
        } else {
            var startTime = new Date(start);
            var endTime = new Date(addOneHour(start));
        }
        if (checkOverlaps(startTime, endTime).length > 0) {
            alert("The event cannot be created because it has overlaps");
            if (undoElement) {
                info.revert()
                undoElement.remove();
                undoElement = '';
                hideUndoPopup();
            }
            if (new_event) {
                new_event.remove();
            }
            closeActiveWindows();
        } else {
            processEventDrop(info, endTime, flag);
        }
    }

    function setEventEndTime(info) {
        var flag = true;
        // Ensure the event has an end time, setting it to 1 hour after the start time if absent
        if (!info.event.end) {
            var endTime = increaseDateTime(info.event.start, 1);
            update(info);
            flag = false;
        } else {
            var endTime = info.event.end;
        }
        return {endTime, flag}
    }

    // Set the event's end time if needed and get the flag
    var {endTime, flag} = setEventEndTime(info);
    if (eventSpanMultipleDays) {
        eventSpanMultipleDays = false;
    } else {
        // Check for overlaps excluding all-day events
        if (!info.event.allDay && checkOverlaps(info.event.start, endTime).length > 0) {
            handleOverlaps();
        } else {
            handleOverlaps2(flag);
        }
    }
}

/**
 * Handles the start of an event drag operation. It checks if there is a new event and compares its start time with the
 * dragged event's start time. If they do not match, the new event is removed, and the dragged event becomes the new
 * event. If there's no new event, the dragged event becomes the clicked event unless there's already a clicked event.
 *
 * @param {Object} info - Information about the event being dragged, including its start time.
 */
function handleEventDragStart(info) {
    if (recurrent_events && recurrent_events.length > 0) {
    } else {
        if (new_event) {
            if (info.event._instance !== new_event._instance) {
                new_event.remove();
                closeActiveWindows();
            } else {
                oldEvent = new_event;
                var infoEvent = new Date(info.event.start);
                var newEvent = new Date(new_event.start);

                if (infoEvent.getTime() !== newEvent.getTime()) {
                    new_event.remove()
                    new_event = '';
                    clickedEvent = info.event;
                }
            }
        } else {
            undoElement = info.event;
            clickedEvent = info.event;
        }
        dragAllDay = info.event.allDay;
    }
}

/**
 * Manages the resizing of an event within the calendar. It checks for overlaps with other events and either alerts the
 * user about the overlap and reverts the change, or updates the event accordingly. If the event is new or clicked, it
 * handles it differently, such as showing an undo popup or removing the new event if it's different from the resized one.
 *
 * @param {Object} info - Information about the event being resized, including start and end times.
 */
function handleEventResize(info) {
    // Check for overlaps except for all-day events
    if (checkOverlaps(info.event.start, info.event.end).length > 0) {
        alert("The current event has overlaps");
        info.revert();
        hideUndoPopup();
    } else {
        if (clickedEvent) {
            showUndoPopup(info);
        } else if (new_event && info.event.start.getTime() !== new_event.start.getTime()) {
            new_event.remove();
            new_event = '';
        } else if (!clickedEvent && !new_event) {
            showUndoPopup(info);
        }
        undoElement = info.event;
        update(info);
        var x = lastKnownMousePosition.x
        var y = lastKnownMousePosition.y
        showPopupOnEventClick(x, y);
    }
}

/**
 * Initializes and configures a FullCalendar instance attached to a specific DOM element. This setup includes
 * configuring the calendar's view, editability, custom buttons for saving changes, handling of events (click, resize,
 * drag, and drop), and a context menu for additional delete option. It dynamically filters editable events, sends
 * data to a server, and processes interactions with dates and events for custom behavior.
 */
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
                    allEvents = allEvents.filter(exEvent => exEvent.durationEditable);
                    sendDataToServer(allEvents, chatId);
                }
            },
        },

        events: events,

        eventAllow: function(dropInfo, draggedEvent) {
            if (recurrent_events && recurrent_events.length > 0) {
                if (new_event._instance === draggedEvent._instance || clickedEvent._instance === draggedEvent._instance) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return true;
            }
        },

        eventClick: function(info) {
            if (clickedEvent && recurrent_events && recurrent_events.length > 0) {
            } else {
                processEventClick(info);
            }
        },

        dateClick: function(info) {
            if (info.date.getHours() === 23 && info.date.getMinutes() === 30) {
                console.log(info.date)
            } else {
                if (clickedEvent && recurrent_events && recurrent_events.length > 0) {
                } else {
                    onDateClick(info);
                }
            }
        },

        eventResize: function(info) {
            handleEventResize(info);
        },

        eventDragStart: function(info) {
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
            processClickedElement(clickedElement);
        }
    });
}

/**
 * Adds one hour to the specified date string and returns the updated date as a string.
 *
 * @param {string} dateString - The date string to which one hour will be added.
 * @returns {string} - The updated date with an additional hour, formatted as a string.
 */
function addOneHour(dateString) {
    const date = new Date(dateString);
    date.setHours(date.getHours() + 1);
    return date.toString();
}

/**
 * Processes clicks on calendar events. If there is a new event and recurrent events exist, it checks whether the clicked
 * event matches the start and end times of the new event. If so, or if there are no conditions on new or recurrent events,
 * it call a handler function for further processing.
 *
 * @param {Object} info - The information about the event that was clicked, including start and end times.
 */
function processEventClick(info) {
    // Check if there is a new event and any recurrent events
    if (new_event && recurrent_events && recurrent_events.length > 0) {
        // Compare the start and end times of the new event with the clicked event
        if (new_event.start.getTime() == info.event.start.getTime() &&
            new_event.end.getTime() == info.event.end.getTime()) {
            onEventClick(info);
        }
    } else {
        onEventClick(info);
    }
}

/**
 * Initializes the application upon DOM content fully loaded. Checks for user information in `tg.initDataUnsafe.user` to
 * set the chat ID. If user information is not available, defaults to a predefined chat ID. It then hides event and undo
 * popups and initializes and fetches existing unavailable time slots.

 * @global {Object} tg.initDataUnsafe.user - Contains Telegram user data, from which the user's ID is extracted.
 * @global {string} chatId - Stores the chat ID determined by user data or defaults to '829695735'.
 */
document.addEventListener('DOMContentLoaded', function() {
    if (tg.initDataUnsafe.user) {
        chatId = tg.initDataUnsafe.user.id;
    } else {
        chatId = '829695735'
    }
    hideEventPopup();
    hideUndoPopup();
    var inputChatIdTest = document.getElementById('test-tg-chat-id');
    get_existing_unavailable_time();
});

/**
 * Splits a date range into individual day segments, handling full days and partial days separately.
 *
 * @param {string} startTime - The ISO string representing the start time of the overall date range.
 * @param {string} endTime - The ISO string representing the end time of the overall date range.
 * @returns {Array} ranges - An array of objects, each representing a date range within the original date range.
 */
function splitDateRangeByDay(startTime, endTime) {
    let start = new Date(startTime);
    let end = new Date(endTime);
    let ranges = [];

    // Handle the first day separately if it starts at a time other than 00:00:00
    let firstDayEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59);
    if (firstDayEnd > end) {
        firstDayEnd = end;
    }
    ranges.push({
        startTime: start.toISOString(),
        endTime: firstDayEnd.toISOString(),
        allDay: false
    });

    // Advance start to the beginning of the next day
    start = new Date(firstDayEnd.getTime() + 1000);

    // Handle full days in between
    while (start < end) {
        let endOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59);
        if (endOfDay >= end) {
            break;  // Do not add this day if it overlaps with the last partial day
        }
        ranges.push({
            startTime: new Date(start).toISOString(),
            endTime: endOfDay.toISOString(),
            allDay: true
        });
        start = new Date(endOfDay.getTime() + 1000); // Move to the start of the next day
    }

    // Handle the last day if there is remaining time after the last full day
    if (start < end) {
        ranges.push({
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            allDay: false
        });
    }

    return ranges;
}

/**
 * Processes and adds an event to a custom calendar based on provided details, including start and end times, summary,
 * calendar type, and whether it's an all-day event.
 *
 * @param {Date} startTime - The start time of the event.
 * @param {Date} endTime - The end time of the event. If identical to startTime, the event is marked as all-day.
 * @param {string} summary - The summary or title of the event.
 * @param {string} calendar_type - The type of calendar the event belongs to, affecting its appearance.
 * @param {boolean} allDay - Indicates whether the event is an all-day event.
 */
function createCalendarDays(startTime, endTime, summary, calendar_type, allDay) {
    if (allCalendarEvents[startTime] &&
        allCalendarEvents[startTime][0].getTime() == endTime.getTime() &&
        allCalendarEvents[startTime][1] == summary) {
        return
    }

    var events = splitDateRangeByDay(startTime, endTime);

    events.forEach(function(result_event) {
        var event = {
            allDay: result_event.allDay,
            title: summary,
            start: result_event.startTime,
            end: result_event.endTime,
            backgroundColor: 'blue',
            borderColor: 'blue',
            editable: false
        };

        if (calendar_type === 'ghl') {
            if (summary === 'Do not disturb') {event.editable = true;}
            event.backgroundColor = 'green'
            event.borderColor = 'green'
        }

        // Adjust end time for allDay events to include the last day fully
        if (event.allDay) {
            let endTimeAdjust = new Date(result_event.endTime);
            endTimeAdjust.setDate(endTimeAdjust.getDate() + 1);
            event.end = endTimeAdjust.toISOString();
        }
        let current_event = calendar.addEvent(event);

        allCalendarEvents[startTime] = [endTime, summary];
    })
}

/**
 * Iterates through an array of events fetched from Google Calendar and formats each event for display on a custom calendar UI.
 *
 * @global {Array} googleCalendarEvents - An array of event objects fetched from Google Calendar, each containing
 * a summary, calendar type, start and end times, and an all-day flag.
 */
function formatGoogleCalendarDays() {
    googleCalendarEvents.forEach(function(calendarEvent) {
        let summary = calendarEvent.summary;
        let calendar_type = calendarEvent.calendar;
        let start_time = new Date(calendarEvent.start_time);
        let end_time = new Date(calendarEvent.end_time);
        let allDay = calendarEvent.all_day
        createCalendarDays(start_time, end_time, summary, calendar_type, allDay)
    })
}

/**
 * Retrieves existing unavailable times from a server for a specific chat ID.
 *
 * @global googleCalendarEvents - Global variable to store Google Calendar events.
 */
function get_existing_unavailable_time() {
    fetch('http://localhost:5000/get_existing_unavailable_time', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: chatId
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

/**
 * Sends an array of events and a chat identifier to a server for processing.
 *
 * @param {Array} allEvents - Array containing the events to be sent to the server.
 * @param {String} chatId - The chat ID associated with the events for identification on the server side.
 */
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

/**
 * Determines if a given `calendarEvent` is considered as a pre-existing event within the calendar and not the same as a
 * potentially newly created or selected event referenced by `new_event`.
 *
 * @param {Object} calendarEvent - The event to check, with a start property.
 * @returns {boolean} - True if `calendarEvent` is considered an "old" event (not matching `new_event`), false otherwise.
 */
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

/**
 * Handles the context menu for a clicked calendar event. If there is a new event, it removes it. Then, it hides any
 * event popup and processes the context menu popup for the clicked element, setting the clicked calendar event and
 * the general clicked event to the current calendar event for further processing.
 *
 * @param {HTMLElement} clickedElement - The element that triggered the context menu.
 * @param {Object} calendarEvent - The calendar event associated with the clicked element.
 */
function handleContextMenuCall(clickedElement, calendarEvent) {
    if (new_event) {
        new_event.remove();
    }
    hideEventPopup();
    processContextMenuPopup(clickedElement);
    clickedCalendarEvent = calendarEvent;
    clickedEvent = calendarEvent;
}

/**
 * Processes a right-clicked element within the calendar, specifically for elements representing busy events. It
 * retrieves the event's start and end times from the element's attributes and looks up the corresponding event object
 * in the calendar. If the event is found and its duration is editable, it checks whether the event is considered busy.
 * If so, it triggers context menu handling for that event.
 *
 * @param {HTMLElement} clickedElement - The element that was clicked, representing a calendar event.
 */
function processClickedElement(clickedElement) {
    var eventStart = clickedElement.getAttribute('data-event-start');
    var eventEnd = clickedElement.getAttribute('data-event-end');
    if (eventStart && eventEnd) {
        let calendarEvent = getEventByStartAndEnd(calendar, eventStart, eventEnd);
        if (calendarEvent && calendarEvent.durationEditable) {
            var isOldEvent = isOldEventFunc(calendarEvent);
            if (isOldEvent) {
                handleContextMenuCall(clickedElement, calendarEvent);
            }
        } else {
            hideContextMenuPopup();
        }
    }
}

/**
 * Positions and displays the context menu popup relative to the clicked element. It calculates the popup's position
 * based on the clicked element's position on the screen, ensuring the popup appears next to the clicked element without
 * extending outside the boundaries of the `calendarElement`.
 */
function processContextMenuPopup(clickedElement) {
    var rect = clickedElement.getBoundingClientRect()
    var y = rect.top;
    var x = rect.left;

    var x_left = x + clickedElement.offsetWidth + 180 <= calendarElement.clientWidth ?
    x + clickedElement.offsetWidth + 10 : x - clickedElement.offsetWidth - 70;
    var y_top = y + 150 <= calendarElement.clientHeight ? y : y - 100;
    if (x_left > 0) {
        x = x_left;
    } else {
        if (x > 145) {
            x = x - 145
        } else {
            y = y - 40;
        }
    }

    contextMenuPopup.style.top = `${y}px`;
    contextMenuPopup.style.left = `${x}px`;
    showContextMenuPopup();
}

// Attach a click event listener to the contextMenuPopup element.
contextMenuPopup.addEventListener('click', function() {
    processDeleteEvents();
    hideContextMenuPopup();
});

/**
 * Searches for and returns the first event in a given calendar that matches a specific start time.
 *
 * @param {Object} calendar - The calendar object from which to retrieve events.
 * @param {string|Date} start - The start date and time to match against calendar events. Can be a string or Date object.
 * @returns {Object|null} The first event that matches the given start time, or null if no matching event is found.
 */
function getEventByStartAndEnd(calendar, start, end) {
    let allEvents = calendar.getEvents();
    var start = new Date(start);
    let matchingEvents = allEvents.filter(event => event.start.getTime() === start.getTime());
    return matchingEvents.length > 0 ? matchingEvents[0] : null;
}

/**
 * Calculates and returns both a dummy end date and an adjusted end date for an event starting on a given date. The dummy
 * end date is generated by adding a specified offset to the start date, used to represent the end date of an event for
 * display or calculation purposes.
 *
 * @param {Date} startDate - The start date from which to calculate the dummy and adjusted end dates.
 * @returns {Object} An object containing the dummy end date (`dummyEndDate`) and the adjusted end date (`adjustedEndDate`).
 */

function getDummyAndAdjustedDates(startDate) {
    var dummyEndDate = getDummyEndDate(startDate, 1);
    var adjustedEndDate = new Date(startDate);
    adjustedEndDate.setHours(23, 59, 59, 999);
    return {dummyEndDate, adjustedEndDate}
}

/**
 * Manages the update process for all-day events, adjusting the displayed end date and updating the event accordingly.
 *
 * @param {Date} startDate - The start date of the all-day event.
 * @param {Date} endDate - The actual end date of the all-day event.
 */
function handleAllDayBlock(startDate, endDate) {
    var dummyEndDate = getDummyEndDate(endDate, -1);
    eventDateEnd.value = formatDateToUserFriendly(dummyEndDate);
    updateEvent(startDate, endDate, isAllDay=true);
}

/**
 * Handles the logic for updating non-all-day events, managing how changes to start and end times are applied. This function
 * employs a comparison between the actual end date of the event and calculated dummy and adjusted end dates to determine
 * the appropriate action.
 *
 * @param {Date} startDate - The start date of the event.
 * @param {Date} endDate - The end date of the event.
 */
function handleDefaultDayBlock(info, startDate, endDate) {
    let {dummyEndDate, adjustedEndDate} = getDummyAndAdjustedDates(startDate)
    if (endDate.getTime() === dummyEndDate.getTime()) {
        updateEvent(startDate, adjustedEndDate);
    } else if (endDate > adjustedEndDate) {
        // If the end date is after the adjusted end date, revert the resize
        alert('Events cannot span multiple days.');
        info.revert();
        hideUndoPopup();
        eventSpanMultipleDays = true;
    } else {
        updateEvent(startDate, endDate);
    }
}

/**
 * Updates an event's details based on the provided information, handling different scenarios for all-day events and
 * events with specific start and end times.
 *
 * @param {Object} info - An object containing information about the event, including its start and end times, and whether
 * it is an all-day event.
 */
function update(info) {
    var startDate = info.event.start;
    var endDate = info.event.end;
    if (!endDate && !info.event.allDay) {
        endDate = increaseDateTime(startDate, 1)
    }
    if (info.event.allDay) {
        handleAllDayBlock(startDate, endDate);
    } else {
        handleDefaultDayBlock(info, startDate, endDate);
    }
}

/**
 * Resets the recurrence popup to its default state. This includes resetting the active day selections to their default
 * state, setting the 'repeat every' input value to 1, ensuring the recurrence type is set to 'week' (and adding the days
 * of the week to the parent element if necessary), and selecting the 'Ends Never' radio button as the default recurrence
 * end option.
 */
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

/**
 * Determines which recurrence end option is selected (either 'Ends On' or 'Ends After') and enables the corresponding
 * input element by adding it to the `elementsToEnable` array.
 */
function showSetPopup() {
    if (radioEndsOn.checked === true) {
        elementsToEnable.push(inputEndsOn)
    } else if (radioEndsAfter.checked === true) {
        elementsToEnable.push(inputEndsAfter)
    }
}

/**
 * Displays the recurrence popup by altering its class list to switch from 'recurrence-box-hidden' to 'recurrence-box',
 * affecting its visibility based on the corresponding CSS. It sets the display style of the `backdrop` to 'block',
 * making it visible.
 */
function showRecurrencePopup(backdrop) {
    recurrence_popup.classList.remove('recurrence-box-hidden');
    recurrence_popup.classList.add('recurrence-box');
    backdrop.style.display = 'block';
    elementsToEnable = [repeatEveryType, repeatEveryInput, recurrenceCancelButton, recurrenceDoneButton]
    var redCircle = document.getElementById('red-circle');

    if (redCircle.style.display === 'none') {
        resetRecurrencePopup();
    } else {
        showSetPopup();
    }
    elementsToEnable.forEach(element => element.disabled = false);
}

/**
 * Hides the recurrence popup by modifying its class list to replace 'recurrence-box' with 'recurrence-box-hidden',
 * effectively changing its visibility based on the associated CSS. Additionally, it sets the display
 * style of the `backdrop` to 'none', making it invisible.
 *
 * @param {HTMLElement} backdrop - The backdrop element that is made invisible when the popup is closed.
 */
function closeRecurrencePopup(backdrop) {
    recurrence_popup.classList.remove('recurrence-box');
    recurrence_popup.classList.add('recurrence-box-hidden');
    backdrop.style.display = 'none';
    elementsToDisable = [repeatEveryType, repeatEveryInput, recurrenceCancelButton, recurrenceDoneButton, inputEndsAfter,
    inputEndsOn]
    elementsToDisable.forEach(element => element.disabled = true);
}

/**
 * Positions and displays the recurrence popup relative to the dimensions of the `calendarElement`. It calculates
 * the popup's top and left positions to center it on the screen, taking into account a fixed width offset.
 *
 * @param {boolean} backdrop - A boolean indicating whether to show a backdrop behind the popup.
 */
function recurrencePopupProcess(backdrop) {
    var top = calendarElement.clientHeight/2;
    var left = calendarElement.clientWidth/2 - 200;

    // Position the popup and show it
    recurrence_popup.style.top = `${top}px`;
    recurrence_popup.style.left = `${left}px`;
    recurrence_popup.style.zIndex = `200`;
    showRecurrencePopup(backdrop);
}

/**
 * Toggles the 'active' class on the event's target element, used for marking a day element as active or inactive
 * based on user clicks.
 *
 * @param {Event} event - The click event that triggered the function.
 */
function toggleActiveClass(event) {
    event.target.classList.toggle('active');
    repeatOnMonth = event.target.id;
}

/**
 * Attaches a click event listener to each element in a collection of DOM elements representing days.
 *
 * @param {NodeList|Array} days - A collection of DOM elements, representing days of the week.
 */
function repeatOnResponse(days){
    if (days) {
        Array.from(days).forEach(function(day) {
            day.addEventListener('click', toggleActiveClass);
        });
    }
}

/**
 * Resets the active state of a collection of DOM elements representing days by removing the 'active' class from all
 * elements except the one with an `id` of '1'.
 *
 * @param {NodeList|Array} days - A collection of DOM elements, representing days of the week.
 */
function resetRepeatOn(days) {
    Array.from(days).forEach(function(day) {
        if (day.id === '1') {
            day.classList.add('active');
        } else {
            day.classList.remove('active');
        }
    });
}

/**
 * Extracts the `id` attributes from a collection of DOM elements, representing days, and returns them as an array.
 *
 * @param {NodeList|Array} days - A collection of DOM elements, representing days.
 * @returns {Array<string>} - An array of strings, each corresponding to the `id` attribute of an element from the input collection.
 */
function getActiveDays(days) {
    const activeDays = Array.from(days).map(element => element.id);
    return activeDays;
}

/**
 * Calculates and returns the date of the first day (Sunday) of the week for a given date.
 *
 * @param {Date} date - The date from which to calculate the first day of its week.
 * @returns {Date} - A new Date object representing the first day (Sunday) of the week for the given date.
 */
function getFirstDayOfWeek(date) {
    const day = date.getDay(); // Get current day of the week (0-6, Sunday to Saturday)
    const firstDay = new Date(date); // Copy the date to avoid mutating the original date
    firstDay.setDate(date.getDate() - day); // Subtract the day number to get to Sunday
    return firstDay;
}

/**
 * Converts a date string in the format "Month DD, YYYY" to a JavaScript Date object and returns its string representation.
 *
 * @param {string} dateString - A date string in the format "Month DD, YYYY".
 * @returns {string} - The string representation of the created Date object.
 */
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

/**
 * Initializes the end date for event generation based on the provided `startTime`, `limitTime`, and `timeType`.
 *
 * @param {string} startTime - The start time for the event series in ISO string format.
 * @param {string} limitTime - A string representing either a date or a number of occurrences (e.g., "10 occurrences") to
 * limit the event series.
 * @param {string} timeType - The frequency of the event series (e.g., "day", "month", "week", "year").
 * @returns {Object} - An object containing the calculated current date, start date, end date, the milliseconds in a day,
 * and an empty array for events.
 */
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
        endDate.setFullYear(startDate.getFullYear() + years);
    }
    const events = [];
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    let currentDate = new Date(startDate);
    return { currentDate, startDate, endDate, dayMilliseconds, events };
}

/**
 * Sets the end time for an event based on the provided `endTime` unless the event is marked as an all-day event.
 *
 * @param {Date} endEventTime - The Date object representing the end time to be updated.
 * @param {Date} endTime - The Date object representing the new end time to be set.
 * @returns {Date} - The updated `endEventTime` object with the new end time set, if applicable.
 */
function getEndEventTime(endEventTime, endTime) {
    if (!getEvent().allDay) {
        endEventTime.setHours(endTime.getHours(), endTime.getMinutes());
    }
    return endEventTime
}

/**
 * Creates a new event with specified start and optional end times, then adds this event to an array of events.
 *
 * @param {Date} currentDate - The current date on which the event is to be created.
 * @param {Date} startDate - A Date object indicating the start time for the new event.
 * @param {Date} [endTime] - An optional Date object indicating the end time for the new event. If not provided, the event
 * is considered as all-day.
 * @param {Array} events - The array to which the new event will be added.
 * @returns {Array} - The updated array of events after adding the new event.
 */
function createNewEvent(currentDate, startDate, endTime, events) {
    const startEventTime = new Date(currentDate);
    startEventTime.setHours(startDate.getHours(), startDate.getMinutes());

    if (!endTime) {
        endEventTime = new Date(startEventTime);
        var event = [startEventTime, endEventTime, true]
    } else {
        var endEventTime = new Date(currentDate);
        var endEventTime = getEndEventTime(endEventTime, endTime)
        var event = [startEventTime, endEventTime]
    }
    events.push(event);

    return events
}

/**
 * Generates event dates for a given week, taking into account specified days of the week on which events should occur.
 * It starts from the first day of the week that contains the current date and iterates through the week. For each day,
 * if it's included in the `includeDays` list, an event is created with the provided start and end times. After
 * processing the week, the current date is advanced by the number of weeks specified by `skipNumber`, preparing for
 * the next cycle of event creation.
 *
 * @param {number} skipNumber - The frequency of weeks to skip before generating more events.
 * @param {string} includeDays - A string of day indices (e.g., "0,1,2") indicating on which days of the week events should be created.
 * @param {Date} currentDate - The current reference date from which the event generation starts.
 * @param {string} startDate - The start time for events in ISO string format, applied within a day.
 * @param {string} endTime - The end time for events in ISO string format, applied within a day.
 * @param {number} dayMilliseconds - The number of milliseconds in a day, used for date calculations.
 * @param {Array} events - The current array of events to which new events will be added.
 * @returns {Date} - The updated current date after processing a week and advancing by the specified number of skip weeks.
 */
function getWeekEventDates(skipNumber, includeDays, currentDate, startDate, endTime, dayMilliseconds, events) {
    let weekStartDate = getFirstDayOfWeek(currentDate)
    let currentDatePointer = new Date(weekStartDate.getTime());
    for (let counter = 0; counter < 7; counter++) {
        if (includeDays.includes(currentDatePointer.getDay().toString())) {
            events = createNewEvent(currentDatePointer, startDate, endTime, events);
        }
        currentDatePointer = new Date(currentDatePointer.getTime() + dayMilliseconds);
    }
    currentDate = new Date(currentDate.getTime() + dayMilliseconds * 7 * skipNumber);

    return currentDate
}

/**
 * Calculates the next event date based on the specified time type (day, month, year) and frequency, then adds a new
 * event to the events array. It adjusts the current date by the specified number of days, months, or years, depending
 * on the time type.
 *
 * @param {string} timeType - Specifies the unit of time for event frequency ('day', 'month', 'year').
 * @param {number} skipNumber - The number of units (specified by timeType) to skip for the next event.
 * @param {Date} currentDate - The current reference date from which the event generation starts.
 * @param {string} startDate - The start time for the event in ISO string format, used within a day.
 * @param {string} endTime - The end time for the event in ISO string format, used within a day.
 * @param {number} dayMilliseconds - The number of milliseconds in a day, used for day calculations.
 * @param {Array} events - The current array of events to which the new event will be added.
 * @returns {Date} - The updated current date after adding the specified number of units.
 */
function getEventDates(timeType, skipNumber, currentDate, startDate, endTime, dayMilliseconds, events) {
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
    events = createNewEvent(currentDate, startDate, endTime, events);
    return currentDate
}

/**
 * Generates a series of event dates based on a set of parameters, including a frequency of occurrence, time type,
 * start and end times, a limit for the date range or number of occurrences, and optionally specific days of the week
 * to include. The function can handle both scenarios where events are limited by a specific end date or by a fixed
 * number of occurrences.
 *
 * @param {number} skipNumber - The frequency of events, indicating how many units (days, weeks, etc.) to skip between events.
 * @param {string} timeType - The unit of time used for the frequency (e.g., days, weeks).
 * @param {string} startTime - The start time for the events in ISO string format.
 * @param {string} endTime - The end time for the events in ISO string format, used within a single day's context.
 * @param {string} limitTime - The limit for generating events, which could be a specific end date or a number of occurrences.
 * @param {string} [includeDays=''] - Optional string of days to include, formatted as a list of day indices (e.g., "0,1,2"
 * for Sunday, Monday, and Tuesday).
 * @returns {Array} - An array of event objects, each containing details about individual events.
 */
function generateEventDates(skipNumber, timeType, startTime, endTime, limitTime, includeDays='') {
    function processGettingEventDates(timeType, skipNumber, includeDays, currentDate, startDate, endTime, dayMilliseconds, events) {
        if (includeDays) {
            currentDate = getWeekEventDates(skipNumber, includeDays, currentDate, startDate, endTime, dayMilliseconds, events);
        } else {
            currentDate = getEventDates(timeType, skipNumber, currentDate, startDate, endTime, dayMilliseconds, events);
        }
        return currentDate;
    }

    var {currentDate, startDate, endDate, dayMilliseconds, events} = setTimeLimit(startTime, limitTime, timeType)
    if (endDate) {
        endDate = new Date(endDate);
        while (currentDate.getTime() < endDate.getTime()) {
            currentDate = processGettingEventDates(
            timeType, skipNumber, includeDays, currentDate, startDate, endTime, dayMilliseconds, events
            );
        }
    } else {
        const number = parseInt(limitTime, 10);
        for (let counter = 0; counter < number; counter++) {
            currentDate = processGettingEventDates(
            timeType, skipNumber, includeDays, currentDate, startDate, endTime, dayMilliseconds, events
            );
        }
    }
    return events;
}

/**
 * Adds an HTML structure representing the days of the week to a specified parent element.
 *
 * @param {Element} parentElement - The DOM element to which the days of the week HTML structure will be appended.
 * @returns {Element} - The parent element after appending the days of the week HTML structure.
 */
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

/**
 * Listens for a 'dateSelected' event and updates the value of the active input element with a user-friendly
 * formatted date. This function targets three specific input fields by their global references: `eventDate`,
 * `eventDateEnd`, and `inputEndsOn`.
 */
window.addEventListener('dateSelected', function(e) {
    const selectedDate = e.detail.date;
    if (document.activeElement === eventDate) {
        eventDate.value = formatDateToUserFriendly(selectedDate);
        eventDate.blur();
    } else if (document.activeElement === eventDateEnd) {
        eventDateEnd.value = formatDateToUserFriendly(selectedDate);
        eventDateEnd.blur();
    } else if (document.activeElement === inputEndsOn) {
        new_ends_on = selectedDate;
        inputEndsOn.value = formatDateToUserFriendly(selectedDate);
        inputEndsOn.blur();
    }
})

/**
 * Updates an event's start and end times, optionally setting it as an all-day event.
 *
 * @param {string} newStartTime - The new start time for the event.
 * @param {string} newEndTime - The new end time for the event.
 * @param {boolean} [isAllDay=false] - Optional parameter to set the event as an all-day event.
 * @returns {string} - Returns the new start time of the event.
 */
function updateEvent(newStartTime, newEndTime, isAllDay=false) {
    var event = getEventInstance(newStartTime, newEndTime);
    if (isAllDay) {
        event.allDay = true
    }
    if (new_event && !clickedEvent) {
        new_event.remove();
        new_event = calendar.addEvent(event);
        let intersectEvent = new_event;
        setTime(new_event)
    } else if (clickedEvent || undoElement) {
        oldClickedEvent = undoElement;
        if (undoElement) {
            oldClickedEvent = undoElement;
            undoElement.remove();
        }
        undoElement = calendar.addEvent(event);
        clickedEvent = undoElement
        let intersectEvent = undoElement;
        setTime(undoElement);
    }
    showTime();
    return newStartTime;
}

/**
 * Combines a date string and a time string into a single Date object.
 *
 * @param {string} dateString - The date string in a format that can be parsed by the Date constructor (e.g., "January 1, 2024").
 * @param {string} timeString - The time string in 12-hour format, including "am" or "pm" (e.g., "12:30pm").
 * @returns {Date} - A Date object representing the combination of the given date and time.
 */
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

/**
 * Determines whether the provided string is in the valid 12-hour clock time format.
 *
 * @param {string} inputString - The time string to be validated.
 * @returns {boolean} - True if the input string matches the specified time format, false otherwise.
 */
function isValidTimeFormat(inputString) {
    // Regular expression to match the format "HH:MMam" or "HH:MMpm"
    var regex = /^(1[0-2]|0?[1-9]):([0-5][0-9])([ap]m)$/i;
    return regex.test(inputString);
}

/**
 * Validates whether a given input string conforms to the specific date format "Month DD, YYYY" and represents a valid date.
 *
 * @param {string} inputString - The input string to validate against the date format.
 * @returns {boolean} - Returns true if the input string matches the "Month DD, YYYY" format and represents a valid date,
 * false otherwise.
 */
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

/**
 * Retrieves the current date and constructs a string representation that includes the date in a human-readable format,
 * the time set to midnight, and the timezone offset from GMT. The timezone is hardcoded to Eastern European Standard Time
 * for demonstration, but the actual offset is dynamically calculated based on the system's local timezone.
 *
 * @returns {string} A string representing the full date and time, formatted as "Wed Feb 28 2024 00:00:00 GMT+0200
 * (Eastern European Standard Time)".
 */
function getTodayDate() {
    var today = new Date();
    var dateString = today.toDateString(); // "Wed Feb 28 2024"
    var midnight = "00:00:00";
    var timezoneOffset = -today.getTimezoneOffset() / 60;
    var timezone = "GMT" + (timezoneOffset >= 0 ? "+" : "") + timezoneOffset.toString().padStart(2, '0') + "00";
    var fullDateString = `${dateString} ${midnight} ${timezone} (Eastern European Standard Time)`;
    return fullDateString;
}

/**
 * Displays an undo popup with a message indicating the recent action taken ('save', 'delete', or 'update') on an event.
 * The function also handles the automatic hiding of the popup after a fixed duration, ensuring it doesn't stay on the
 * screen indefinitely.
 */
function showUndoPopup(info) {
    setTimeout(function() {
        if (info == 'save') {
            undoPopupText.textContent = 'Event saved';
        } else if (info == 'delete') {
            undoPopupText.textContent = 'Event deleted';
        } else {
            undoPopupText.textContent = 'Event updated';
        }
    }, 200);

    // Resets any ongoing timeouts for hiding or showing the popup, calculates new position based on the current window
    // size, and shows the popup by setting its display and opacity.
    function resetAndShowPopup() {
        clearTimeout(hidePopupTimeout);
        clearTimeout(showPopupDelayTimeout);

        var left = window.innerWidth / 2 - 50;
        var top = window.innerHeight - 70;
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        popup.style.display = 'block';
        popup.style.opacity = '1';
        // Initiate a timeout to automatically hide the popup after 10 sec
        hidePopupTimeout = setTimeout(function() {
            hideUndoPopup();
        }, 10000);
    }

    newInfo = info;
    if (hidePopupTimeout) {
        hideUndoPopup();
        showPopupDelayTimeout = setTimeout(function() {
            resetAndShowPopup();
        }, 200);
    } else {
        resetAndShowPopup();
    }
}

/**
 * Hides the undo popup with a transition effect. It positions the popup near the bottom of the calendar element, fades it out by
 * reducing opacity to 0, and then sets its display to 'none' after a brief delay, ensuring the fade-out animation is visible.
 */
function hideUndoPopup() {
    var top = calendarElement.clientHeight - 20;
    popup.style.top = `${top}px`;
    popup.style.opacity = '0';
    setTimeout(function() {
        popup.style.display = 'none';
    }, 200);
}

// Removes the currently clicked event from the calendar if it exists and is not associated with a new event creation process.
function removeClickedEvent() {
    if (clickedEvent && new_event) {
    } else if (clickedEvent) {
        clickedEvent.remove();
        clickedEvent = '';
    }
}

/**
 * Handles the save option by first removing the currently clicked event. It then iterates over an array of changed events,
 * removing each from the calendar if it exists and hides the event popup.
 *
 * @global changed_events - An array tracking individual events that have been added, deleted, or modified.
 */
function handleSave() {
    changed_events.forEach(function(changed_event) {
        if (changed_event) {
            changed_event.remove();
        }
    })
    hideEventPopup();
}

/**
 * Determines if two objects are equal by comparing their properties. It checks if both objects have the same number of
 * properties and then compares each property's value.
 *
 * @param {Object} obj1 - The first object to compare.
 * @param {Object} obj2 - The second object to compare.
 * @returns {boolean} True if both objects have the same properties with equal values; false otherwise.
 */
function areObjectsEqual(obj1, obj2) {
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

/**
 * Compares two sublists for equality by checking if they have the same length and if corresponding elements are equal.
 * Equality of elements is determined by a custom comparison function (`areObjectsEqual`) designed to compare objects.
 *
 * @param {Array} sublist1 - The first sublist to compare.
 * @param {Array} sublist2 - The second sublist to compare.
 * @returns {boolean} True if both sublists have the same length and all corresponding elements are equal; false otherwise.
 */
function areSublistsEqual(sublist1, sublist2) {
    if (sublist1.length !== sublist2.length) return false;
    for (let i = 0; i < sublist1.length; i++) {
        if (!areObjectsEqual(sublist1[i], sublist2[i])) return false;
    }
    return true;
}

/**
 * Removes duplicate sublists from a list of sublists by checking each sublist against all others for equality.
 * Sublists are considered equal if a custom comparison function (`areSublistsEqual`) determines them to be so.
 *
 * @param {Array} listOfSublists - An array containing sublists, each of which is a list of elements.
 * @returns {Array} A new array of sublists where each sublist is unique, having removed any duplicates.
 */
function removeDuplicateSublists(listOfSublists) {
    return listOfSublists.reduce((acc, currentSublist) => {
        const duplicateFound = acc.some(sublist => areSublistsEqual(sublist, currentSublist));
        if (!duplicateFound) acc.push(currentSublist);
        return acc;
    }, []);
}

/**
 * Updates a sublist within a list of changed elements if a matching pattern is found. It searches for a sublist where all
 * elements exist in the provided set of changed elements and the sublist is shorter than the provided list of changed elements.
 * If such a sublist is found, it is replaced with the new, larger list of changed elements.
 *
 * @param {Array} allChangedElements - An array of sublists, each containing elements that have changed.
 * @param {Array} changed_elements - The new list of changed elements to update in the sublist.
 * @returns {Array} The updated array of sublists with the specified sublist replaced, if a matching one was found.
 */
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

/**
 * Handles a delete option when revert deleted event to the previous state(creates it again)
 *
 * @global changed_events - An array tracking individual events that have been added, deleted, or modified.
 * @global allChangedEvents - An array of arrays, each representing a collection of events that have been changed
 * together at some point.
 */
function handleDelete() {
    if (undoElement) {
        changed_events.push(undoElement);
    }
    changed_events.forEach(function(changed_event) {
        calendar.addEvent(changed_event);
    })
    updateSublist(allChangedEvents, changed_events);
    if (changed_events.length > 2) {
        allChangedEvents.push(changed_events);
        allChangedEvents = removeDuplicateSublists(allChangedEvents);
    }
    hideEventPopup();
}

// Handles an update option when revert updated event to the previous state
function handleUpdate() {
    const querySel = ".fc-scroller.fc-scroller-liquid-absolute"
    let position = document.querySelector(querySel).scrollTop;

    undoElement.remove();
    calendar.addEvent(oldClickedEvent);
    calendar.gotoDate(oldClickedEvent.start);
    document.querySelector(querySel).scrollTop = position;

    undoElement = '';
    clickedEvent = '';
    oldClickedEvent = '';
    hideEventPopup();
}

// Reverts any changes made during the current action.
function handleRevert() {
    undoElement.remove();
    newInfo.revert();
    clickedEvent = oldClickedEvent;
    if (recurrent_events && recurrent_events.length > 0) {
    } else {
        hideEventPopup();
    }
}

/**
 * Attaches a click event listener to the undoButton. This function first hides any context menu popups and then
 * performs actions based on the `newInfo` state. If there are recurrent events, it shows a discard popup; otherwise, it
 * hides the undo popup. If a new event is being created, it is removed and cleared from the state.
 */
document.getElementById('undoButton').addEventListener('click', function() {
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

    hideUndoPopup();
    if (new_event) {
        new_event.remove();
        new_event = '';
    }
    if (oldClickedEvent) {
        setTime(oldClickedEvent);
    }
});

// Attach a click event listener to closePopup button
document.getElementById('closePopup').addEventListener('click', function() {
    hideUndoPopup();
});

// Show a red circle used to alert users about existing recurrent dates.
function showRedCircle() {
    var redCircle = document.getElementById('red-circle');
    redCircle.style.display = 'block';
}

// Hides a red circle.
function hideRedCircle() {
    var redCircle = document.getElementById('red-circle');
    redCircle.style.display = 'none';
}

/**
 * Extracts and formats the start and end times from an event object. If the event has a specified end time, it uses that;
 * otherwise, it calculates the end time based on the event's duration.
 *
 * @param {Object} event - The event object from which to extract start and end times.
 * @returns {Object} An object containing the start and end times of the event.
 */
function getEventStartEndTimes(event) {
    var startTime = new Date(event.start);
    var endTime = new Date(event.end);
    return {startTime, endTime}
}

/**
 * Determines the limit for recurrent event occurrences based on user-selected end conditions. If the 'radioEndsOn option
 * is selected, it uses the date from the input field. If radioEndsAfter is selected, it specifies a number of occurrences.
 * Otherwise, no limit is set.
 *
 * @returns {String} The limit time for the recurrence, either as a date, a number of occurrences, or an empty string if
 * there's no limit.
 */
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

/**
 * Initializes new recurrent events based on the selected recurrence pattern and other specified conditions. It determines
 * the recurrence type and interval from user inputs, calculates start and end times for the event, and sets a limit for
 * the recurrence. For weekly recurrences, it also identifies active days of the week to include. The function then
 * generates dates for the recurrent events according to these parameters and updates the global list of recurrent events.
 *
 * @global recurrent_events - An array used to store generated dates for recurrent events.
 */
function setNewRecurrentEvents() {
    var timeType = repeatEveryType.value;
    var skipNumber = repeatEveryInput.value;
    var event = getEvent();
    var {startTime, endTime} = getEventStartEndTimes(event);
    if (!endTime) {
        endTime = increaseDateTime(startTime, 1)
    }
    const limitTime = getLimitTime();

    if (timeType == 'week') {
        var activeDays = document.querySelectorAll('.day.active');
        var includeDays = getActiveDays(activeDays);
        recurrent_events = generateEventDates(skipNumber, timeType, startTime, endTime, limitTime, includeDays);
    } else {
        recurrent_events = generateEventDates(skipNumber, timeType, startTime, endTime, limitTime)
    }
}

/**
 * Attaches an input event listener to both the repeatEveryInput and inputEndsAfter input fields. This listener enforces
 * a minimum value of 1 and a maximum value of 99 for these inputs, automatically correcting entered values to stay
 * within these bounds.
 */
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

/**
 * Positions a custom calendar popup relative to a focused element, calculating its placement based on the element's
 * position on the screen.
 *
 * @param {HTMLElement} element - The element that has gained focus, prompting the positioning of the custom calendar popup.
 */
function handleElementFocus(element) {
    var rect = element.getBoundingClientRect()
    var top = rect.top - 100;
    var left = rect.left - 115;
    customCalendarPopup.style.top = `${top + element.offsetHeight}px`;
    customCalendarPopup.style.left = `${left}px`;
    customCalendarPopup.classList.remove('hidden');
}

// Attach a focus event listener to inputEndsOn field
inputEndsOn.addEventListener('focus', function() {
    handleElementFocus(inputEndsOn);
})

/**
 * Attaches a blur event listener to the inputEndsOn input field. When focus is lost, it hides custom calendar popup and
 * checks the validity of the date format entered. If the date format is invalid, it resets the input's value to a
 * user-friendly formatted string based on a predefined date value.
 */
inputEndsOn.addEventListener('blur', function() {
    customCalendarPopup.classList.add('hidden');
    var is_date_valid = isValidDateFormat(inputEndsOn.value);
    if (!is_date_valid) {
        inputEndsOn.value = formatDateToUserFriendly(new_ends_on)
    }
})

// Updates the disabled state of input fields related to event ending conditions based on the currently selected radio button.
function updateDisabledStates() {
    inputEndsOn.disabled = !radioEndsOn.checked;
    inputEndsAfter.disabled = !radioEndsAfter.checked;
}

// Attach a change event listener to radio buttons
[radioEndsNever, radioEndsOn, radioEndsAfter].forEach(radio => {
    radio.addEventListener('change', updateDisabledStates);
});

/**
 * Attaches a change event listener to the repeatEveryType dropdown in a form, adjusting the UI based on the selected
 * recurrence pattern. If 'week' is selected, it adds day-of-week selection options and sets up their behavior. For all
 * other recurrence types, it removes the day-of-week options if they exist.
 */
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

// Attach a click event listener to backdrop
backdrop.onclick = function(event) {
  if (event.target === backdrop) {
    closeRecurrencePopup(backdrop);
    hideDiscardPopup();
    hideDeleteRecurringEventPopup();
  }
}

// Attach a click event listener to recurrenceCancelButton
recurrenceCancelButton.onclick = function() {
    changed_events = [];
    recurrent_events = [];
    closeRecurrencePopup(backdrop);
    hideRedCircle();
}

// Attach a click event listener to recurrenceDoneButton
recurrenceDoneButton.onclick = function() {
    setNewRecurrentEvents();
    toggleMoreSaveButtons();
    closeRecurrencePopup(backdrop);
}

// Attach a focus event listener to eventDate field
eventDate.addEventListener('focus', function() {
    handleElementFocus(eventDate);
})

// Attach a focus event listener to eventDateEnd field
eventDateEnd.addEventListener('focus', function() {
    handleElementFocus(eventDateEnd);
})

/**
 * Generates new start and end times for an event based on user inputs for date and time.
 *
 * @returns {Object} An object containing the new start and end times for the event as Date objects.
 */
function getNewStartEndTimes() {
    var newDate = new Date(convertDateFormat(eventDate.value));
    var newStartTime = concatenateDateTime(newDate, eventStartTime.value);
    var newEndTime = concatenateDateTime(newDate, eventEndTime.value);
    return {newDate, newStartTime, newEndTime}
}

/**
 * Determines the new start and end times for an event based on user input. If the end time input is '12:00am', indicating
 * the end of the day, and the new start time is later than the new end time, it adjusts the new end time to '11:59pm' of
 * the same day to ensure the event ends before the start of the next day.
 *
 * @returns {Object} An object containing the new start and end times for the event.
 */
function getEventNewStartEndTime() {
    var {newDate, newStartTime, newEndTime} = getNewStartEndTimes()
    if (newStartTime > newEndTime) {
        newEndTime = increaseDateTime(newStartTime, 1)
    }

    // Check if the end time is on a different day from the start time
    if (newStartTime.getDate() !== newEndTime.getDate()) {
        newEndTime = new Date(newStartTime);
        newEndTime.setHours(23, 59, 59, 999);
    }

    if (eventEndTime.value === '12:00am') {
        if (newStartTime > newEndTime) {
            var newEndTime = concatenateDateTime(newDate, '11:59pm');
        }
    }
    return {newStartTime, newEndTime}
}

/**
 * Updates an event's start and end times if they have changed from the original times, returning the new start time.
 *
 * @returns {Date} newSTime - The new start time of the event after update, if changes were made; otherwise None.
 */
function handleUpdateEvent() {
    var event = getEvent();
    undoElement = event;
    var oldStartTime = event.start;
    var oldEndTime = event.end;

    let {newStartTime, newEndTime} = getEventNewStartEndTime()
    if (oldStartTime.getTime() !== newStartTime.getTime() || oldEndTime.getTime() !== newEndTime.getTime()) {
        updateFromInput = true;
        var newSTime = updateEvent(newStartTime, newEndTime)
        if (clickedEvent) {
            showUndoPopup("update");
        }
        return newSTime
    }
}

/**
 * Dynamically adjusts the width of an input element based on its placeholder text. It uses a temporary, invisible span
 * element to measure the text width, then applies this width to the input element, ensuring a fit-to-content style.
 *
 * @param {HTMLElement} inputElement - The input element whose width is to be adjusted based on its content.
 */
function adjustWidth(inputElement) {
    // Create a temporary span to measure text width
    var span = document.createElement('span');
    span.style.visibility = 'hidden'; // Make span invisible
    span.style.position = 'absolute'; // Remove from flow
    span.style.height = 'auto';
    span.style.width = 'auto';
    span.style.whiteSpace = 'nowrap'; // Prevent line breaks
    span.innerText = inputElement.value || inputElement.placeholder;

    // Append to body to measure
    document.body.appendChild(span);

    // Set input width based on span width, then remove span
    inputElement.style.width = (span.offsetWidth - 5) + 'px'; // +20 for padding/border

    document.body.removeChild(span);
}

/**
 * Handles updates for all-day events, including changing their start and/or end dates. It first retrieves the old start
 * and end dates of the event, then compares them with the new dates from input fields. If there are changes and the new
 * start date is before or on the same day as the new end date, it updates the event with these new dates. An undo popup
 * is shown for clicked events that are updated.
 */
function handleUpdateAllDayEvent() {
    function handleCorrectStartEndDatesInput(newStartDate, newEndDate) {
        var newEndDate = getDummyEndDate(newEndDate, 1);
        updateEvent(newStartDate, newEndDate, true)
        if (clickedEvent) {
            showUndoPopup("update");
        }
    }

    function getOldStartEndDates() {
        var event = getEvent();
        var oldStartDate = event.start;
        var oldEndDate = event.start;
        if (event.end) { oldEndDate = getDummyEndDate(event.end, -1) }
        return {oldStartDate, oldEndDate}
    }

    var {oldStartDate, oldEndDate} = getOldStartEndDates()
    var newStartDate = new Date(convertDateFormat(eventDate.value));
    var newEndDate = new Date(convertDateFormat(eventDateEnd.value));
    oldEndDate.setHours(23, 59, 59, 999);
    newEndDate.setHours(23, 59, 59, 999);
    if (oldStartDate.getTime() !== newStartDate.getTime() || oldEndDate.getTime() !== newEndDate.getTime()) {
        if (newStartDate.getTime() <= newEndDate.getTime()) {
            if (checkOverlaps(newStartDate, newEndDate).length > 0) {
                alert("The current event has overlaps");
                var event = getEvent()
                setTime(event);
            } else {
                handleCorrectStartEndDatesInput(newStartDate, newEndDate);
            }
        } else {
            // If the new dates are not in order, reset the input fields to reflect the original dates
            eventDate.value = formatDateToUserFriendly(oldStartDate);
            eventDateEnd.value = formatDateToUserFriendly(oldEndDate);
        }
    }
}

/**
 * Checks for overlaps between the event time range defined by the input fields and existing events.
 *
 * @returns {boolean} True if there are overlaps between the constructed event time range and existing events; false otherwise.
 */
function checkIntersectionsFromInputFields() {
    var {newDate, newStartTime, newEndTime} = getNewStartEndTimes()
    return checkOverlaps(newStartTime, newEndTime).length > 0
}

/**
 * Handles correct date inputs for an event form. If the event is not marked as an all-day event, it attempts to update the event
 * with new timing. If no new start time is returned, it derives a new date from the input element's value. For the start date
 * input specifically, it navigates the calendar to the newly set date. For all-day events, a separate update routine is invoked.
 * After processing, it adjusts the width of the input element for a consistent user interface.
 *
 * @param {HTMLElement} inputDateElement - The input element with a valid date, such as the event's start or end date input.
 */
function handleCorrectDateInput(inputDateElement) {
    const querySel = ".fc-scroller.fc-scroller-liquid-absolute"
    let position = document.querySelector(querySel).scrollTop;
    if (!getEvent().allDay) {
        var newSTime = handleUpdateEvent();
        if (!newSTime) {
            var newSTime = new Date(inputDateElement.value);
        }
        if (inputDateElement == eventDate) {
            calendar.gotoDate(newSTime);
            document.querySelector(querySel).scrollTop = position;
        }
    } else {
        handleUpdateAllDayEvent();
    }
    adjustWidth(inputDateElement);
}

/**
 * Handles incorrect date inputs by resetting the value of the specified input date element to the event's start or end
 * date, depending on which input element is being corrected. It formats the date for user-friendly display and adjusts the
 * width of the input element for a consistent UI.
 *
 * @param {HTMLElement} inputDateElement - The input element being corrected, such as the event's start or end date input.
 */
function handleIncorrectDateInput(inputDateElement) {
    var event = getEvent();
    var dateEnd = event.start;
    if (inputDateElement == eventDateEnd) {
        if (event.end) {dateEnd = event.end}
    }
    inputDateElement.value = formatDateToUserFriendly(dateEnd)
    adjustWidth(inputDateElement);
    hideUndoPopup();
}

/**
 * Validates and processes an input date element for an event form, handling different scenarios based on the element's role
 * (start date or other) and whether the event is all-day or has potential overlaps.
 *
 * @param {HTMLElement} inputDateElement - The input date element to validate and process, either for the event's start
 * date or end date input.
 */
function handleDateInput(inputDateElement) {
    function handleEventDateInput() {
        var event = getEvent();
        if (!event.allDay && checkIntersectionsFromInputFields()) {
            alert("The current event has overlaps");
            handleIncorrectDateInput(eventDate);
        } else {
            handleCorrectDateInput(eventDate);
        }
    }

    updateFromInput = true;
    customCalendarPopup.classList.add('hidden');
    var is_date_valid = isValidDateFormat(inputDateElement.value);
    if (is_date_valid) {
        if (inputDateElement == eventDate) {
            handleEventDateInput();
        } else {
            handleCorrectDateInput(inputDateElement);
        }
    } else {
        handleIncorrectDateInput(inputDateElement);
    }
}

// Attach a keypress event listener on Enter button to all input fields
var inputFields = [eventDate, eventDateEnd, eventStartTime, eventEndTime]
inputFields.forEach(function(inputField) {
    inputField.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            inputField.blur();
        }
    });
})

// Attach a blur event listener to eventDate field
eventDate.addEventListener('blur', function() {
    handleDateInput(eventDate);
});


// Attach a blur event listener to eventDateEnd field
eventDateEnd.addEventListener('blur', function() {
    handleDateInput(eventDateEnd);
});

/**
 * Sets the date and time fields in an event form based on the provided event's details. It formats the start date and time
 * and optionally the end date and time if available. For all-day events, it adjusts the end date to display correctly.
 *
 * @param {Object} event - The event object containing start and optionally end times, as well as an allDay boolean flag.
 */
function setTime(event) {
    eventDate.value = formatDateToUserFriendly(event.start.toDateString());
    eventStartTime.value = formatAMPM(event.start);

    if (event.end) {
        var showNextDays = event.allDay ? -1 : 0;
        var dummyEndDate = getDummyEndDate(event.end, showNextDays);
        eventEndTime.value = formatAMPM(event.end);
    } else {
        var dummyEndDate = event.start
    }
    eventDateEnd.value = formatDateToUserFriendly(dummyEndDate);
}

/**
 * Validates and updates an event form's input element based on its time format and comparison. It handles correct and
 * incorrect time inputs differently. For correct inputs, it checks for overlaps with existing events and either updates
 * the event time or resets it. For incorrect inputs, it updates the input element based on the previous event times and
 * logs an error.
 *
 * @param {HTMLElement} inputElement - The input element from the event form to be validated and updated.
 */
function updateEventFormInputElement(inputElement){
    function handleCorrectInputTimeFromField() {
        let {newStartTime, newEndTime} = getEventNewStartEndTime()
        if (checkOverlaps(newStartTime, newEndTime).length > 0) {
            alert("The event cannot overlap with existing ones");
            var event = getEvent();
            setTime(event);
            hideUndoPopup();
        } else {
            // Update an event if there are no overlaps
            handleUpdateEvent();
        }
    }

    // Update an input element with old values
    function handleIncorrectInputTimeFromField() {
        var event = getEvent();
        if (inputElement == eventStartTime) {
            inputElement.value = formatAMPM(event.start);
        } else if (inputElement == eventEndTime) {
            inputElement.value = formatAMPM(event.end);
        }
    }

    var flag = isValidTimeFormat(inputElement.value)
    flag = flag === true ? eventStartTime.value !== eventEndTime.value : false;
    if (flag) {
        handleCorrectInputTimeFromField();
    } else {
        handleIncorrectInputTimeFromField();
    }
}

/**
 * Attaches click event listeners to the input fields for the event's start and end times. Upon clicking one of these fields,
 * the function computes the positioning of the time picker relative to the clicked input field and toggles its visibility.
 *
 * @param {HTMLElement[]} inputFields - An array containing the input fields for the event's start and end times.
 */
[eventStartTime, eventEndTime].forEach(function(inputField) {
    inputField.addEventListener('click', function() {
        var rect = inputField.getBoundingClientRect()
        var top = rect.top;
        var left = rect.left;
        timePicker.style.top = `${top + inputField.offsetHeight}px`;
        timePicker.style.left = `${left}px`;

        populateTimes(inputField);
        timePicker.classList.toggle('show');
    })
})

/**
 * Fills a specified time picker element with time options, iterating from the start of the day to the end of the day.
 * This function creates selectable time slots for either the start or end time of an event, adjusting in 15-minute
 * increments. For end times, it additionally calculates and displays the duration from the start time to each end time
 * option. Selecting a time option updates the associated input field and closes the picker.
 *
 * @param {HTMLElement} timeField - An input field for time selection that triggers the time picker(startTime or endTime)
 * @param {Date} currentTime - The current time from which the picker options will start: the start of the day for startTime
 * and the startTime + 15 min for endTime.
 * @param {Date} startTime - The event's start time, used to calculate duration until end times.
 * @param {Date} endOfDay - The latest possible time for the day, set to 23:59:59.999.
 * @param {HTMLElement} eventStartTime - The input field for the event's start time, used for comparison.
 * @param {HTMLElement} eventEndTime - The input field for the event's end time, used for comparison.
 */
function generateTimes(timeField, currentTime, startTime, endOfDay, eventStartTime, eventEndTime) {
    while (currentTime <= endOfDay) {
        var timeOption = document.createElement('div');
        if (timeField === eventEndTime) {
            currentTime.setMinutes(currentTime.getMinutes() + 15);
        }
        var time = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
        time = time.replace(' PM', 'pm').replace(' AM', 'am');

        if (timeField === eventEndTime) {
            // Calculate time difference for end time slots
            var diff = (currentTime - startTime) / 60000; // diff in minutes
            var diffHours = Math.floor(diff / 60);
            var diffMinutes = diff % 60;
            var timeDiffText = '';
            if (diff >= 60) {
                // Display in hours and fractions if more than an hour
                timeDiffText = ` (${diffHours + diffMinutes / 60} hrs)`;
            } else {
                // Otherwise, just display the minutes
                timeDiffText = ` (${diffMinutes} mins)`;
            }
            time += timeDiffText;
        }

        timeOption.textContent = time;
        timeOption.onclick = function(e) {
            timeField.value = e.target.textContent.split(' ')[0];
            timePicker.classList.remove('show');
            updateEventFormInputElement(timeField);
        };
        timePicker.appendChild(timeOption);
        if (timeField === eventStartTime) {
            currentTime.setMinutes(currentTime.getMinutes() + 15);
        }
    }
}

/**
 * Populates a time picker with selectable times based on the event's start time, adjusting for a 12-hour format as needed.
 * It sets the time field with a range of times from the start of the event's day to the end of the day. This function also
 * attaches an event listener to close the time picker when clicking outside of it.
 *
 * @param {HTMLElement} timeField - An input field for time selection that triggers the time picker(startTime or endTime)
 */
function populateTimes(timeField) {
    var event = getEvent();
    var currentTime = new Date(event.start);
    var endOfDay = new Date(event.start);
    var startTimeValue = eventStartTime.value;
    var startTime = new Date(event.start);
    var startTimeParts = startTimeValue.match(/(\d+):(\d+)(am|pm)/);
    if (startTimeParts) {
        // Adjust hours for 12-hour format and set up the start time date object
        var hours = parseInt(startTimeParts[1], 10) + (startTimeParts[3] === 'pm' && startTimeParts[1] !== '12' ? 12 : 0);
        var minutes = parseInt(startTimeParts[2], 10);
        startTime.setHours(hours, minutes, 0, 0);
        if (hours === 12 && startTimeParts[3] === 'am') {
            startTime.setHours(0); // Adjust for midnight
        }
    }

    // If clicked input field is start time input, then it should have times from the start of the day(12:00am)
    if (timeField === eventStartTime) {
        currentTime.setHours(0, 0, 0, 0);
    }
    endOfDay.setHours(23, 59, 59, 999);
    timePicker.innerHTML = '';

    generateTimes(timeField, currentTime, startTime, endOfDay, eventStartTime, eventEndTime);

    // Event listener to close the picker if clicked outside
    document.addEventListener('click', function(e) {
        if (e.target !== timeField && e.target.parentNode !== timePicker) {
            timePicker.classList.remove('show');
        }
    }, true);
};

// Attach a blur event listener to eventStartTime field
eventStartTime.addEventListener('blur', function() {
    updateEventFormInputElement(eventStartTime);
});

// Attach a blur event listener to eventEndTime field
eventEndTime.addEventListener('blur', function() {
    updateEventFormInputElement(eventEndTime);
});

/**
 * Closes the event popup and clears related data. It triggers the display of an undo popup with a specific message, hides
 * the event popup, resets the clicked and new event variables, clears the list of recurrent events, and hides a red circle.
 *
 * @global clickedEvent - Currently selected or clicked event, which will be reset.
 * @global new_event - A new event being created or edited, which will be cleared.
 * @global recurrent_events - An array of recurrent events, which will be emptied.
 */
function clearAndCloseEventPopup() {
    showUndoPopup('save');
    hideEventPopup();
    clickedEvent = new_event;
    new_event = '';
    recurrent_events = [];
    hideRedCircle();
}

/**
 * Retrieves the current event being interacted with, giving priority to a clicked event over a new event.
 *
 * @global clickedEvent - The event last interacted with by the user.
 * @global new_event - A new event that is currently being created.
 * @returns {Object} The current event, either clicked or new, being interacted with.
 */
function getEvent() {
    if (clickedEvent) {
        var event = clickedEvent;
    } else if (new_event) {
        var event = new_event;
    }
    return event;
}

/**
 * Handles the creation of a new recurrent event with specified start and end times. It creates a recurrent event instance,
 * sets its all-day status based on the current event being processed, adds the new recurrent event to the calendar, and
 * tracks this event in a global array of changed events.
 *
 * @global changed_events - An array tracking events that have been added or modified.
 * @param {Date} recStart - The start date/time for the recurrent event.
 * @param {Date} recEnd - The end date/time for the recurrent event.
 */
function handleCreateRecurrentEvent(recStart, recEnd, isSubtract=false) {
    recurrent_event = getEventInstance(recStart, recEnd);
    if (!isSubtract) {
        var allDay = getEvent().allDay;
    } else {
        var allDay = false;
    }
    isSubtract = false;
    recurrent_event.allDay = allDay;
    var new_recurrent_event = calendar.addEvent(recurrent_event);
    changed_events.push(new_recurrent_event);
}

/**
 * Checks if a default (non-all-day) event matches a specified time range by comparing the start and end times of
 * both the existing event and the specified range.
 *
 * @param {Object} event - The existing event object, which should have properties or methods to determine its start and end times.
 * @param {Date} start - The specified start time to check against the existing event's time range.
 * @param {Date} end - The specified end time to check against the existing event's time range.
 * @returns {boolean} - Returns true if the specified time range starts after or at the same time as the existing event's
 *         start time and ends before or exactly at the existing event's end time; otherwise, returns false.
 */
function isExistingDefaultEventFunc(existEvent, newStart, newEnd) {
    // Check if newEnd has "00:00:00" as time and adjust if true
    if (newEnd.getHours() === 0 && newEnd.getMinutes() === 0 && newEnd.getSeconds() === 0 && newEnd.getMilliseconds() === 0) {
        newEnd.setHours(23, 59, 59, 999);
    }

    const {startTime, endTime} = getEventStartEndTimes(existEvent);
    result = newStart.getTime() >= startTime.getTime() && newEnd.getTime() <= endTime.getTime();
    return result
}

/**
 * Determines if an existing event is an all-day event that matches a specified start date.
 *
 * @param {Object} event - The existing event object, with a start property indicating the start date/time.
 * @param {Date} start - The start date to compare against the existing event's start date.
 * @returns {boolean} - Returns true if the existing event's start date matches the specified start date, indicating
 * it is the same all-day event; returns false otherwise.
 */
function isExistingAllDayEventFunc(event, start) {
    var eventStart = new Date(event.start);
    return eventStart.getTime() === start.getTime();
}

/**
 * Checks if an event, represented by a start and end time (and optionally a third element for all-day events),
 * already exists within a list of existing events.
 *
 * @param {Array} element - An array representing a recurrent event's start and end times, with an optional an all-day events.
 * @param {Array} existingEvents - An array of existing event objects to be checked for the presence of the event represented by `element`.
 * @returns {boolean} - Returns true if the event exists within the list of existing events, false otherwise.
 */
function isExistingEventFunc(element, existingEvents) {
    var isExistingEvent = existingEvents.some(function(event) {
        let newStart = element[0]
        let newEnd = element[1]
        if (event.allDay) {
            if (element.length === 2) {
                return isExistingAllDayEventFunc(event, newStart)
            } else {
                return isExistingDefaultEventFunc(event, newStart, newEnd);
            }
        } else {
            return isExistingDefaultEventFunc(event, newStart, newEnd);
        }
    });
    return isExistingEvent
}

/**
 * Processes the creation of recurrent event by first filtering out intersecting events from a list of existing events,
 * then subtracting these intersecting time ranges from the recurrent event's time range. For each resulting time range
 * where the recurrent event does not intersect with existing events, it creates a new recurrent event.
 *
 * @param {Array} element - A tuple representing the start and end times of a recurrent event as Date objects.
 * @param {Array} existingEvents - An array of existing event objects, each potentially containing start, end, and other properties.
 */
function processCreateRecurrentEvent(element, existingEvents) {
    let recurrentEvent = {startTime: element[0], endTime: element[1]}
    let intersectEvents = filterIntersectingRanges(recurrentEvent, existingEvents)
    let subtractEvents = subtractTimeRanges(recurrentEvent, intersectEvents)
    var isSubtract = false;
    if (intersectEvents.length > 0) {
        hasIntersectionsFlag = true;
        isSubtract = true;
    }
    subtractEvents.forEach(function(subtractEvent) {
        let recStart = new Date(subtractEvent.start)
        let recEnd = new Date(subtractEvent.end)
        handleCreateRecurrentEvent(recStart, recEnd, isSubtract=isSubtract);
    })
}

/**
 * Iterates through recurrent events to process them against a given event and a list of existing events. It checks if
 * each recurrent event is already existing or occurs after the given event's start time. For those that meet the criteria,
 * it further processes them based on whether the given event is an all-day event, handling the creation of recurrent
 * events accordingly.
 *
 * @global recurrent_events - An array of new recurrent events.
 * @param {Object} event - The event being processed, with at least a start property and potentially an allDay property.
 * @param {Array} existingEvents - An array of existing event objects to compare against for finding overlaps or duplications.
 */
function processRecurrentEvents(event, existingEvents) {
    var startEvent = new Date(event.start);
    recurrent_events.forEach(function(element) {
        var isExistingEvent = isExistingEventFunc(element, existingEvents);
        var isBiggerThanStartEvent = element[0].getTime() >= startEvent.getTime();
        if (isExistingEvent || !isBiggerThanStartEvent) {
            hasIntersectionsFlag = true;
        } else {
            processCreateRecurrentEvent(element, existingEvents);
        }
    })
}

/**
 * Processes and creates recurrent events based on existing events in the calendar. It adds the processed event to the list
 * of changed events and stores all changed events for further actions.
 *
 * @global changed_events - An array that tracks events that have been modified or added.
 * @global allChangedEvents - An array that stores all sets of changed events, including those newly marked as recurrent.
 * @param {Array} existingEvents - An array of existing event objects to compare against for finding overlaps or duplications.
 */
function createRecurrentEvents(existingEvents) {
    setNewRecurrentEvents();
    var event = getEvent()
    processRecurrentEvents(event, existingEvents);
    if (hasIntersectionsFlag) {
        alert("Your events were cut due to overlap");
        hasIntersectionsFlag = false;
    }
    changed_events.push(event);
    allChangedEvents.push(changed_events);
}

/**
 * Filters events from a list that intersect with a given recurrent event, excluding those that are duration editable unless
 * they exactly match the start and end times of the recurrent event but have a different title. This function is used to
 * identify events that potentially conflict with the recurrent event.
 *
 * @param {Object} recurrentEvent - An object representing the recurrent event, with startTime and endTime properties.
 * @param {Array} allEvents - An array of event objects, each containing start, end and durationEditable.
 * @returns {Array} An array of event objects that intersect with the recurrent event's time range, based on specific criteria,
 *          including non-editability of duration or exact time overlap with a different title.
 */
function filterIntersectingRanges(recurrentEvent, allEvents) {
    const largeStart = new Date(recurrentEvent.startTime).getTime();
    const largeEnd = new Date(recurrentEvent.endTime).getTime();
    const intersectingRanges = allEvents.filter(range => {
        const smallStart = new Date(range.start).getTime();
        const smallEnd = new Date(range.end).getTime();

        return !range.durationEditable && smallStart < largeEnd && smallEnd > largeStart && largeStart !== smallStart ||
                !range.durationEditable && smallStart < largeEnd && smallEnd > largeStart && largeEnd !== smallEnd ||
                smallStart === largeStart && smallEnd === largeEnd && range.title !== 'Do not disturb';
    });

    return intersectingRanges;
}

/**
 * Subtracts an array of smaller time ranges from a larger time range, returning the resulting time ranges where the
 * larger range is not overlapped by any of the smaller ranges. Each time range is adjusted to avoid overlap by a minute,
 * ensuring no part of the smaller ranges is included in the result.
 *
 * @param {Object} largeRange - An object with startTime and endTime properties representing the larger time range.
 * @param {Array} smallRanges - An array of objects, each with start and end properties representing smaller time ranges
 * to be subtracted.
 * @returns {Array} An array of objects representing the resulting time ranges after subtraction. Each object has start
 * and end properties, which are strings representing the start and end times of the resulting ranges.
 */
function subtractTimeRanges(largeRange, smallRanges) {
    // Convert start and end times of large range to Date objects
    let currentStart = new Date(largeRange.startTime);
    const end = new Date(largeRange.endTime);

    // Prepare an array to hold the resulting time ranges
    const resultingRanges = [];

    // Function to add a minute to a Date object
    const addMinute = (date) => new Date(date.getTime() + 60000);

    // Function to subtract a minute from a Date object
    const subtractMinute = (date) => new Date(date.getTime() - 60000);

    smallRanges.forEach((range) => {
        const start = new Date(range.start);
        const end = new Date(range.end);

        // Check if the current start time is before the small range's start time
        if (currentStart < start) {
            // Add the range from currentStart to one minute before the small range's start
            resultingRanges.push({
                start: currentStart,
                end: subtractMinute(start),
            });
        }

        // Update the current start to be one minute after the small range's end
        currentStart = addMinute(end);
    });

    // After processing all small ranges, check if there's remaining time in the large range
    if (currentStart < end) {
        resultingRanges.push({
            start: currentStart,
            end: end,
        });
    }

    // Adjust the last range if it extends beyond the large range's end time
    const lastRange = resultingRanges[resultingRanges.length - 1];
    if (lastRange && lastRange.end > end) {
        lastRange.end = end;
    }

    // Convert the Date objects back to strings if necessary
    return resultingRanges.map(range => ({
        start: range.start.toString(),
        end: range.end.toString(),
    }));
}

/**
 * Processes the saving of calendar events. It first clears the array that tracks changed events, then checks for
 * recurrent events. If recurrent events exist, it processes them using existing events from the calendar. If no
 * recurrent events are present, it adds the new event to the list of changed events. Finally, it clears and closes
 * the event popup.
 *
 * @global changed_events - An array used to track events that have been changed.
 * @global new_event - The new event that may be added to the changed events array if no recurrent events are present.
 */
function processSave() {
    changed_events = [];
    var existingEvents = calendar.getEvents();
    if (recurrent_events && recurrent_events.length > 0) {
        createRecurrentEvents(existingEvents);
    } else {
        changed_events.push(new_event);
        undoElement = new_event;
    }
    clearAndCloseEventPopup();
}

// Attach a click event listener to save button
save.addEventListener('click', function() {
    processSave();
});

// Attach a click event listener to recurrenceButton button
recurrenceButton.addEventListener('click', function() {
    recurrencePopupProcess(backdrop);
});

// Attach a click event listener to moreOptionsButton button
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
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Generates a function to handle clicks on day elements within the calendar. When a day is clicked, it updates the global
 * date variable to reflect the selected day and dispatches a custom 'dateSelected' event with the new date.
 *
 * @global date - The global date variable that will be updated with the clicked day's date.
 * @param {number} dayone - The weekday of the first day of the current month (0 for Sunday, 6 for Saturday).
 * @param {number} lastdate - The number of days in the current month.
 * @param {number} dayend - The weekday of the last day of the current month.
 * @param {number} monthlastdate - The last date of the previous month.
 * @param {string} lit - The HTML string generated for the calendar days, not directly used in this function.
 * @returns {Function} A function that takes a day element and its index, updates the global date variable, and dispatches
 * a 'dateSelected' event with the selected date.
 */
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

/**
 * Constructs and displays the calendar view for a given month and year, including the days from the previous and next months
 * to complete the weeks. It dynamically marks today's date as active, fills the calendar with dates, and adjusts for an
 * additional row if the total displayed days fit within 5 rows or less. It also sets up click event listeners for each day.
 */
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
