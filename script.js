let tg = window.Telegram.WebApp;

let date = new Date();
let year = date.getFullYear();
let month = date.getMonth();

const day = document.querySelector(".calendar-dates");
const currdate = document.querySelector(".calendar-current-date");
const prenexIcons = document.querySelectorAll(".calendar-navigation span");

const selectRange = document.getElementById("select-range-button")
const selectIndividualDays = document.getElementById("select-individual-days-button")
let is_select_range = false;
selectIndividualDays.style.backgroundColor = "#4285f4";

const showDates = document.getElementById("show-dates-button")
const showHours = document.getElementById("show-hours-button")
const cancelRange = document.getElementById("cancel-range-button")
const deleteRange = document.getElementById("delete-range-button")
let is_show_hours = false;
showDates.style.backgroundColor = "#4285f4";
cancelRange.classList.add("hidden");
deleteRange.classList.add("hidden");

const timeInput = document.getElementById("ex2");
const wholeDayOff = document.getElementById("whole-day-off-button")
const outOfOffice = document.getElementById("out-of-office-button")
const inOffice = document.getElementById("in-office-button")
const confirmButton = document.getElementById("confirm-button")

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

let selectedDates = [];
let clickedDates = [];
let deleteDates = [];
let startDate = -1;
let endDate;


/**
 * Checks if a given day is marked as active based on a list of selected dates.
 *
 * @param {number} i - The day of the month to check.
 * @param {number} month - The zero-based index of the month to check (0 for January, 11 for December).
 * @param {number} year - The year to check.
 * @returns {boolean} - True if the specified day is active (i.e., matches a date in `selectedDates`), false otherwise.
 *
 * Note: This function uses the global variable `selectedDates`
 */
function isActiveDay(i, month, year) {
    let isActive = selectedDates.some(selectedDate => {
        const selectedDateObj = new Date(selectedDate.date);
        return selectedDateObj.getDate() === i &&
                selectedDateObj.getMonth() === month &&
                selectedDateObj.getFullYear() === year;
    });
    return isActive;
}


/**
 * Checks if a given day is marked as clicked based on a list of clicked dates.
 *
 * @param {number} i - The day of the month to check.
 * @param {number} month - The zero-based index of the month to check (0 for January, 11 for December).
 * @param {number} year - The year to check.
 * @returns {boolean} - True if the specified day is clicked (i.e., matches a date in `clickedDates`), false otherwise.
 *
 * Note: This function uses the global variable `clickedDates`
 */
function isClickedDay(i, month, year) {
    let isClicked = clickedDates.some(clickedDates =>
        clickedDates.getDate() === i &&
        clickedDates.getMonth() === month &&
        clickedDates.getFullYear() === year);
    return isClicked;
}


/**
 * Filters out and returns all dates marked as blocked for a specified day, month, and year.
 *
 * @param {number} i - The day of the month to check.
 * @param {number} month - The zero-based index of the month to check (0 for January, 11 for December).
 * @param {number} year - The year to check.
 * @returns {Array} - An array of dates (single Date object) that are blocked for the specified day, month, and year.
 *
 * Note: This function uses the global variable `selectedDates`
 */
function blockedDay(i, month, year) {
    let blockedDays = selectedDates.filter(selectedDate => {
        const selectedDateObj = new Date(selectedDate.date);
        return selectedDateObj.getDate() == i &&
                selectedDateObj.getMonth() == month &&
                selectedDateObj.getFullYear() == year;
    });
    return blockedDays;
}


/**
 * Determines if a specified day is fully blocked based on time ranges associated with each selected date.
 *
 * @param {number} i - The day of the month to check.
 * @param {number} month - The zero-based index of the month to check (0 for January, 11 for December).
 * @param {number} year - The year to check.
 * @returns {boolean} - True if the specified day is fully blocked, false otherwise.
 *
 * Note: This function uses the global variable `selectedDates`
 */
function isFullBlockedDay(i, month, year) {
    let isFullBlocked = selectedDates.some(selectedDate => {
        const selectedDateObj = new Date(selectedDate.date);
        return selectedDateObj.getDate() === i &&
                selectedDateObj.getMonth() === month &&
                selectedDateObj.getFullYear() === year &&
                ['12:00 AM-11:59 PM', '12:00 AM-12:00 AM'].includes(selectedDate.time);
    });
    return isFullBlocked;
}


/**
 * Generates HTML list items (`<li>`) representing days in a calendar view, marking fully unavailable, clicked, blocked,
 * and inactive days.
 *
 * @param {number} dayone - The weekday of the first day of the current month (0 for Sunday, 6 for Saturday).
 * @param {number} lastdate - The number of days in the current month.
 * @param {number} dayend - The weekday of the last day of the current month.
 * @param {number} monthlastdate - The last date of the previous month.
 * @param {string} lit - Initial HTML string to which the function appends `<li>` elements.
 * @returns {string} - The updated HTML string including `<li>` elements for each day in the calendar view.
 */

function displayUnavailableDays(dayone, lastdate, dayend, monthlastdate, lit) {
    // Loop to add the last dates of the previous month
    for (let i = dayone; i > 0; i--) {
        lit +=`<li class="inactive">${monthlastdate - i + 1}</li>`;
    }
    // Loop to add the dates of the current month
    for (let i = 1; i <= lastdate; i++) {
        // Check if the current day is in selectedDates
        let isActive = isActiveDay(i, month, year);
        // Check if the current day is in clickedDates
        let isClicked = isClickedDay(i, month, year);
        // Check if the current day has '12:00 AM-12:00 AM' time range
        let isFullBlocked = isFullBlockedDay(i, month, year);

        if (isClicked) {
            lit += `<li class="clicked">${i}</li>`;
        } else if (isFullBlocked) {
            lit += `<li class="fullBlocked">${i}</li>`;
        } else if (isActive) {
            lit += `<li class="active">${i}</li>`;
        }else {
            lit += `<li class="">${i}</li>`;
        }
    }

    // Loop to add the first dates of the next month
    for (let i = dayend; i < 6; i++) {
        lit += `<li class="inactive">${i - dayend + 1}</li>`
    }

    return lit;
}


/**
 * Generates HTML list items (`<li>`) for a calendar, marking days with unavailable hours based on blocked time ranges.
 *
 * This function extends the concept of displaying days on a calendar to include marking specific hours as unavailable.
 * It loops through each day of the current month, checks against a list of blocked days (`blockedDay` function), and
 * appends `<li>` elements with special classes or styles to indicate the status of each day's hours. Days with fully
 * blocked hours are marked distinctly, and days with specific unavailable hours are listed with their blocked time ranges.
 *
 * @param {number} dayone - The weekday of the first day of the current month (0 for Sunday, 6 for Saturday).
 * @param {number} lastdate - The number of days in the current month.
 * @param {number} dayend - The weekday of the last day of the current month.
 * @param {number} monthlastdate - The last date of the previous month.
 * @param {string} lit - Initial HTML string to which the function appends `<li>` elements.
 * @returns {string} - The updated HTML string including `<li>` elements for each day in the calendar view, with special
 * markings for blocked hours.
 */
function displayUnavailableHours(dayone, lastdate, dayend, monthlastdate, lit) {
    // Loop to add the last dates of the previous month
    for (let i = dayone; i > 0; i--) {
        lit +=`<li class="inactive">${monthlastdate - i + 1}</li>`;
    }

    // Loop to add the dates of the current month
    for (let i = 1; i <= lastdate; i++) {
        // Check if the current day is in selectedDates
        let blockedDays = blockedDay(i, month, year);

        if (blockedDays.length > 0) {
            const blockedDay = blockedDays[0];
            if (blockedDay.time === '12:00 AM-11:59 PM' || blockedDay.time === '12:00 AM-12:00 AM') {
                lit += `<li class="hoursBlocked" style="color: red;">${"12:00 AM-12:00 AM"}</li>`
            } else {
                if (Array.isArray(blockedDay.time)) {
                    lit += `<li class="hoursBlocked" style="margin-top: 0px;">`;
                    for (let i = 0; i < blockedDay.time.length; i++) {
                        lit += `${blockedDay.time[i]} `;
                    }
                    lit += `</li>`;
                } else {
                    lit += `<li class="hoursBlocked">${blockedDay.time}</li>`;
                }
            }
        } else {
            lit += `<li class="">${i}</li>`;
        }
    }

    // Loop to add the first dates of the next month
    for (let i = dayend; i < 6; i++) {
        lit += `<li class="inactive">${i - dayend + 1}</li>`
    }

    return lit;
}


/**
 * Selects or deselects a range of dates between two clicks in a calendar UI, highlighting or unhighlighting them.
 *
 * This function allows users to select a range of dates in a calendar by clicking on two different days. The first click
 * marks the start of the selection, and the second click marks the end. All dates in between are then highlighted as selected.
 * If a selected day is clicked again, it and any associated range are deselected.
 *
 * @param {HTMLElement} dayElement - The day element that was clicked.
 * @param {number} dayone - The weekday of the first day of the current month (0 for Sunday, 6 for Saturday).
 * @param {number} lastdate - The number of days in the current month.
 * @param {number} dayend - The weekday of the last day of the current month.
 * @param {number} monthlastdate - The last date of the previous month.
 *
 * Note: This function uses the global variables `startDate`, `endDate`, and `clickedDates` to track the start date,
 * end date, and array of all selected dates, respectively.
 */
function selectDateRange(dayElement, dayone, lastdate, dayend, monthlastdate) {
    if (dayElement.classList.contains("clicked")) {
        // Initialize or update the start date
        startDate = startDate === -1 ? date : startDate;
        endDate = date;
        if (startDate > endDate) {
            let temp = startDate;
            startDate = endDate;
            endDate = temp;
        }
        const daysToAdd = Math.abs((endDate - startDate) / (24 * 60 * 60 * 1000));

        // Add the range of dates to clickedDates
        for (let i = 0; i <= daysToAdd; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            clickedDates.push(currentDate);
        }

        // Highlight the range in the UI
        clickedDates.forEach(clickedDate => {
            const dayIndex = clickedDate.getDate() + dayone - 1;
            if (clickedDate.getMonth() === month && clickedDate.getFullYear() === year) {
                const dayElement = document.querySelector(`.calendar-dates li:nth-child(${dayIndex + 1})`);
                dayElement.classList.add("clicked");
            }
        });

        // Reset start date after selecting a range
        if (startDate !== endDate) {
            startDate = -1;
        }

    } else {
        // Remove the date from the selectedDates array if it's no longer active
        clickedDates = clickedDates.filter(clickedDates => clickedDates.getTime() !== date.getTime());
        startDate = -1;
    }
}


/**
 * Toggles the selection state of individual days in a calendar UI, adding or removing them from a tracking array.
 *
 * This function is designed to manage user interactions with a calendar UI, where clicking a day element toggles its
 * selected state. Selected days are added to a global `clickedDates` array, and if a selected day is marked with
 * special classes ('active' or 'fullBlocked'), it is also added to a `deleteDates` array for further processing.
 * Conversely, if a day is deselected, it is removed from the `clickedDates` array. This allows for complex interactions
 * such as marking days as active, inactive, or blocked, and handling their selection status accordingly.
 *
 * @param {HTMLElement} dayElement - The day element that was clicked, assumed to contain the date in a `data-date` attribute.
 * @param {number} dayone - The weekday of the first day of the current month (0 for Sunday, 6 for Saturday), not used here.
 * @param {number} lastdate - The number of days in the current month, not used here.
 * @param {number} dayend - The weekday of the last day of the current month, not used here.
 * @param {number} monthlastdate - The last date of the previous month, not used here.
 *
 * Note: This function uses the global variables `date`, `clickedDates` and `deleteDates`
 */
function selectDaysIndividual(dayElement, dayone, lastdate, dayend, monthlastdate) {
    if (dayElement.classList.contains("clicked")) {
        // Add the date to clickedDates array if not already selected
        clickedDates.push(date);
        if (dayElement.classList.contains("active") || dayElement.classList.contains("fullBlocked")) {
            deleteDates.push(date);
        }
    } else {
        // Remove the date from the selectedDates array if it's no longer active
        clickedDates = clickedDates.filter(clickedDates => clickedDates.getTime() !== date.getTime());
    };
}


/**
 * Returns a function that handles click events on day elements within a calendar UI, toggling their selection
 * state and managing date ranges or individual selections.
 *
 * This function generates a click event handler tailored for day elements in a calendar. It manages toggling
 * the selection state of days, supporting both range selections and individual day selections based on global flags.
 * The function updates global tracking variables and UI elements to reflect the current selection state.
 *
 * @param {number} dayone - The weekday of the first day of the current month (0 for Sunday, 6 for Saturday).
 * @param {number} lastdate - The number of days in the current month.
 * @param {number} dayend - The weekday of the last day of the current month.
 * @param {number} monthlastdate - The last date of the previous month.
 * @param {string} lit - Initial HTML string, not directly used in the click handler but required for consistency
 * with the function signature.
 * @returns {Function} - A function that handles click events on day elements, accepting the clicked `dayElement` and
 * its `index` within the month.
 *
 * Note: This function uses the global variables `date`, `cancelRange` and `deleteRange`
 */
function handleDaysClick(dayone, lastdate, dayend, monthlastdate, lit) {
    const handleDayClick = (dayElement, index) => {
		// Update the date variable with the clicked day
		let day_index = index - dayone;
		date = new Date(year, month, day_index+1);

		if (!is_show_hours) {
			dayElement.classList.toggle("clicked");
		}

		if (is_select_range) {
			selectDateRange(dayElement, dayone, lastdate, dayend, monthlastdate);
		} else {
			selectDaysIndividual(dayElement, dayone, lastdate, dayend, monthlastdate);
		}

        // Update UI controls based on the current selection
		if (clickedDates.length === 0) {
			cancelRange.classList.add("hidden");
			deleteRange.classList.add("hidden");
		} else {
			cancelRange.classList.remove("hidden");
			deleteRange.classList.remove("hidden");
		}
	}

	return handleDayClick
}


/**
 * Removes a specific date from the global array of clicked dates.
 *
 * @param {Date} date - The date to be removed from the `clickedDates` array.
 *
 * Note: This function uses the global variable `clickedDates`
 */
function removeFromClicked(date) {
    clickedDates = clickedDates.filter(clickedDates => clickedDates.getTime() !== date.getTime());
}


/**
 * Removes a specific date from the global array of selected dates.
 *
 * @param {Date} dateToRemove - The date to be removed from the `selectedDates` array.
 *
 * Note: This function uses the global variable `selectedDates`
 */
function removeFromSelected(dateToRemove) {
    selectedDates = selectedDates.filter(selectedDate => {
        const selectedDateObj = new Date(selectedDate.date);
        return (
            selectedDateObj.getTime() !== dateToRemove.getTime()
        );
    });
}


/**
 * Finds the index of a specific date in the array of selected dates that matches the given date to update.
 *
 * @param {Date} dateToUpdate - The date for which the index needs to be found in the `selectedDates` array.
 * @returns {number} - The index of the matching date entry in the `selectedDates` array. Returns -1 if no match is found.
 *
 * Note: This function uses the global variable `selectedDates`
 */
function getDateIndexToUpdate(dateToUpdate) {
    // Get an index of the date we want to update
    const indexToUpdate = selectedDates.findIndex(entry => {
        const entryDate = new Date(entry.date);
        return (
            entryDate.getTime() === dateToUpdate.getTime() &&
            entryDate.getMonth() === dateToUpdate.getMonth() &&
            entryDate.getFullYear() === dateToUpdate.getFullYear()
        );
    });
    return indexToUpdate;
}


/**
 * Updates or adds the unavailable time range for a specific date in the `selectedDates` array.
 *
 * @param {Date} dateToUpdate - The date for which the unavailable time range needs to be updated or added.
 * @param {string} newFrom - The start of the new unavailable time range.
 * @param {string} newTo - The end of the new unavailable time range.
 *
 * Note: This function uses the global variable `selectedDates`
 */
function updateUnavailableTime(dateToUpdate, newFrom, newTo) {
    const indexToUpdate = getDateIndexToUpdate(dateToUpdate);
    if (indexToUpdate !== -1) {
        // Update the 'from-to' value for the matching date
        selectedDates[indexToUpdate].date = `${dateToUpdate}`;
        selectedDates[indexToUpdate].time =  `${newFrom}-${newTo}`;
    } else {
        // Handle the case where the date is not found
        let dateObj = {
            date: `${dateToUpdate}`,
            time:  `${newFrom}-${newTo}`
        };
        selectedDates.push(dateObj);
    }
}


/**
 * Updates or adds available time ranges for a specific date within the `selectedDates` array.
 *
 * @param {Date} dateToUpdate - The date for which the available time range needs to be updated or added.
 * @param {string} newFrom - The start time of the new availability period.
 * @param {string} newTo - The end time of the new availability period.
 *
 * Note: This function uses the global variable `selectedDates`
 */
function updateAvailableTime(dateToUpdate, newFrom, newTo) {
    const indexToUpdate = getDateIndexToUpdate(dateToUpdate);

    let startTime = newFrom === '12:00 AM' ? '' : `12:00 AM-${newFrom}`;
    let endTime = newTo === '12:00 AM' ? '' : `${newTo}-12:00 AM`;
    let time = '';
    // Construct the time string based on the availability of start and end times
    if (startTime && endTime) {
        time = [startTime, endTime];
    } else {
        time = startTime || endTime;
    }

    if (indexToUpdate !== -1) {
        // Existing date found, update its time range
        selectedDates[indexToUpdate].date = `${dateToUpdate}`;
        selectedDates[indexToUpdate].time = time;
    } else {
        // Date not found, add a new entry
        let dateObj = {
            date: `${dateToUpdate}`,
            time:  time
        };
        selectedDates.push(dateObj);
    }
}


/**
 * Clears the selection from all clicked days in the calendar and optionally marks them as blocked or active based on a flag.
 *
 * This function iterates through all day elements in the calendar, identified by ".calendar-dates li", and removes the "clicked",
 * "active", and "fullBlocked" classes from each. Depending on the provided flag, it can then add either "fullBlocked" or "active"
 * to denote the new status of the days.
 *
 * @param {string} flag - Determines the new class to add to each day element after clearing "clicked". Expected values
 * are 'blocked' or 'active'.
 *
 * Note: This function directly manipulates the DOM.
 */
function changeAllClickedToActiveOrFullBlocked(flag) {
    const days = document.querySelectorAll(".calendar-dates li");
    days.forEach(day => {
        if (day.classList.contains("clicked")) {
            day.classList.remove("clicked");
            day.classList.remove("active");
            day.classList.remove("fullBlocked");
            if (flag === 'blocked') {
                day.classList.add("fullBlocked");
            } else if (flag === "active"){
                day.classList.add("active");
            }
        }
    });
    cancelRange.classList.add("hidden");
    deleteRange.classList.add("hidden");
    manipulate();
}


/**
 * Adds an event listener for the 'click' event on the 'wholeDayOff' element. When clicked, it sets the slider to span
 * the entire day, updates the start and end times based on user input, and processes each date in the `clickedDates`
 * array to update their unavailable time slots and remove them from the clicked list. Finally, it changes all clicked
 * dates' status to fully blocked.
 *
 * Note: This function relies on jQuery to set the slider value and manipulate DOM elements. It also uses global
 * variables `clickedDates`, `startTime`, `endTime`, and `selectedDates`.
 */
wholeDayOff.addEventListener('click', function () {
    $("#ex2").slider('setValue', [0, 1440]);
    startTime = document.getElementById("startTime").value;
    endTime = document.getElementById("endTime").value;
    clickedDates.forEach(date => {
        updateUnavailableTime(date, startTime, endTime);
        removeFromClicked(date);
    });
    changeAllClickedToActiveOrFullBlocked('blocked');
    console.log(selectedDates);
});


/**
 * Adds an event listener for the 'click' event on the 'outOfOffice' element. When clicked, it updates the start and end
 * times based on user input, processes each date in the `clickedDates` array to update their unavailable time slots,
 * and removes them from the clicked list. It then sets the status of the dates in the `clickedDates` array to either
 * fully blocked or selected, based on the start and end times.
 *
 * Note: This function uses global variables `clickedDates`, `startTime` and `endTime`.
 */
outOfOffice.addEventListener('click', function () {
    startTime = document.getElementById("startTime").value;
    endTime = document.getElementById("endTime").value;
    clickedDates.forEach(date => {
        updateUnavailableTime(date, startTime, endTime);
        removeFromClicked(date);
    });
    if (startTime === '12:00 AM' && endTime === '12:00 AM') {
        changeAllClickedToActiveOrFullBlocked('blocked');
    } else {
        changeAllClickedToActiveOrFullBlocked('active');
    }
    console.log(selectedDates);
});


/**
 * Adds an event listener for the 'click' event on the 'inOffice' element. When clicked, it updates the start and end
 * times based on user input and processes each date in the `clickedDates` array. For each date, it either removes the
 * date from the selected list if the start and end times are both '12:00 AM', or adds the unavailable times for
 * the date from '12:00 AM' to startTime and from endTime to '12:00 AM'. It then removes the date from the clicked list.
 * Afterwards, it changes the status of all processed dates in the `clickedDates` array to 'active' or keeps them as
 * 'fullBlocked', based on their updated states.
 *
 * Note: This function uses global variables `clickedDates`, `startTime`, `endTime`.
 */
inOffice.addEventListener('click', function () {
    startTime = document.getElementById("startTime").value;
    endTime = document.getElementById("endTime").value;
    clickedDates.forEach(date => {
        if (startTime === '12:00 AM' && endTime === '12:00 AM') {
            removeFromSelected(date);
        } else {
            updateAvailableTime(date, startTime, endTime);
        }
        removeFromClicked(date);
    });
    changeAllClickedToActiveOrFullBlocked('active');
    console.log(selectedDates);
});


/**
 * Generates and displays a calendar for the specified month and year, either showing unavailable days or hours based on
 * the `is_show_hours` flag. It also sets up click event listeners for each day in the calendar, allowing for specific
 * interactions when a day is clicked.
 *
 * Note: This function uses global variables `year`, `month`, `is_show_hours`.
 */
function manipulate() {
	// Get the first day of the month
	let dayone = new Date(year, month, 1).getDay();
	// Get the last date of the month
	let lastdate = new Date(year, month + 1, 0).getDate();
	// Get the day of the last date of the month
	let dayend = new Date(year, month, lastdate).getDay();
	// Get the last date of the previous month
	let monthlastdate = new Date(year, month, 0).getDate();
	// Variable to store the generated calendar HTML
	let lit = "";

	if (!is_show_hours) {
		lit = displayUnavailableDays(dayone, lastdate, dayend, monthlastdate, lit);
	} else {
		lit = displayUnavailableHours(dayone, lastdate, dayend, monthlastdate, lit);
	};

	// Update the text of the current date element with the formatted current month and year
	currdate.innerText = `${months[month]} ${year}`;
	// update the HTML of the dates element with the generated calendar
	day.innerHTML = lit;
	// Select all the days in the calendar
    const days = document.querySelectorAll(".calendar-dates li");

	handleDayClick = handleDaysClick(dayone, lastdate, dayend, monthlastdate, lit);

    // Attach a click event listener to each day
    days.forEach((dayElement, index) => {
		dayElement.addEventListener("click", function (event) {
			event.preventDefault();
			handleDayClick(dayElement, index);
        });
    });
}


/**
 * Adds an event listener for the 'click' event on the 'selectRange' element. When clicked, this function changes the
 * background color of selectIndividualDays and selectRange buttons and also sets the flag `is_select_range` to true.
 * Resets the start date selection.
 *
 * Note: This function uses global variables `selectIndividualDays`, `selectRange`, `is_select_range`, and `startDate`.
 */
selectRange.addEventListener('click', function() {
    selectIndividualDays.style.backgroundColor = "#ccc";
    selectRange.style.backgroundColor = "#4285f4";
    is_select_range = true;
    startDate = -1;
});


/**
 * Adds an event listener for the 'click' event on the 'selectIndividualDays' element. When clicked, this function changes
 * the background color of selectIndividualDays and selectRange buttons and also sets the flag `is_select_range` to false.
 *
 * Note: This function uses global variables `selectIndividualDays`, `selectRange` and `is_select_range`.
 */
selectIndividualDays.addEventListener('click', function() {
    selectRange.style.backgroundColor = "#ccc";
    selectIndividualDays.style.backgroundColor = "#4285f4";
    is_select_range = false;
});


/**
 * Hides the 'deleteRange' and 'cancelRange' buttons and resets the start date selection.
 *
 * Note: This function uses global variables `deleteRange`, `cancelRange` and `startDate`.
 */
function resetUI() {
    deleteRange.classList.add("hidden");
    cancelRange.classList.add("hidden");
    startDate = -1;
}


/**
 * Adds an event listener for the 'click' event on the 'deleteRange' element. When clicked, this function iterates through
 * all dates stored in the `clickedDates` array, removing each date from both the selected and clicked lists. Resets the
 * UI to its default state.
 *
 * Note: This function uses global variable `clickedDates`
 */
deleteRange.addEventListener('click', function() {
    clickedDates.forEach(date => {
        removeFromSelected(date);
        removeFromClicked(date)
    });
    changeAllClickedToActiveOrFullBlocked()
    resetUI();
});


/**
 * Adds an event listener for the 'click' event on the 'cancelRange' element. It clears the `clickedDates` array, removes
 * the "clicked" class from all day elements in the calendar to visually deselect them, and then resets the UI to its default state.
 *
 * Note: This function uses global variable `clickedDates`
 */
cancelRange.addEventListener('click', function() {
    clickedDates = [];
    const days = document.querySelectorAll(".calendar-dates li");
    days.forEach(day => {
        if (day.classList.contains("clicked")) {
            day.classList.remove("clicked");
        }
    });
    resetUI();
    manipulate();
});

/**
 * Adds an event listener for the 'click' event on the 'showDates' element. When clicked, this function changes the UI
 * to highlight the 'showDates' button and deselect the 'showHours' button. It then sets a is_show_hours to false to
 * indicate that dates should be shown.
 *
 * Note: This function uses global variables `showHours`, `showDates`, `is_show_hours`.
 */
showDates.addEventListener('click', function() {
	showHours.style.backgroundColor = "#ccc";
	showDates.style.backgroundColor = "#4285f4";
	is_show_hours = false;
	manipulate();
});


/**
 * Adds an event listener for the 'click' event on the 'showHours' element. When clicked, this function changes the UI
 * to highlight the 'showHours' button and deselect the 'showDates' button. It then sets a is_show_hours to true to
 * indicate that hours should be shown.
 *
 * Note: This function uses global variables `showHours`, `showDates`, `is_show_hours`.
 */
showHours.addEventListener('click', function() {
	showDates.style.backgroundColor = "#ccc";
	showHours.style.backgroundColor = "#4285f4";
	is_show_hours = true;
	manipulate();
});


/**
 * Iterates over each icon in the `prenexIcons` array and attaches a click event listener to it. When an icon is clicked,
 * the function checks the icon's id to determine if it represents moving to the previous month ("calendar-prev") or the
 * next month ("calendar-next"). It then adjusts the `month` variable accordingly. If adjusting the month results in a
 * value outside the range of 0-11 (January to December), it corrects the year and month to reflect the correct date.
 *
 * Note: This function uses global variables `date`, `month` and `year`.
 */
prenexIcons.forEach(icon => {
	icon.addEventListener("click", () => {
		// Check if the icon is "calendar-prev" or "calendar-next"
		month = icon.id === "calendar-prev" ? month - 1 : month + 1;
		// Check if the month is out of range
		if (month < 0 || month > 11) {
			// Set the date to the first day of the month with the new year
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
		// Call the manipulate function to update the calendar display
		manipulate();
	});
});


/**
 * Converts a time string in the format "HH:MM AM/PM" to the total number of minutes since midnight. Optionally adjusts
 * the calculation for end times to support a time range that ends at midnight properly.
 *
 * @param {string} timeString: The time string to convert, expected in the format "HH:MM AM/PM".
 * @param {boolean} isStart: A flag indicating whether the time string represents the start time of a range. If false and
 * the time string represents midnight, it adjusts the return value to reflect the end of the day (1440 minutes).
 *
 * @returns {number} totalMinutes: The total number of minutes since midnight represented by the input time string. For
 * end times representing midnight and `isStart` is false, it returns 1440 to indicate the end of the day.
 */
function convertTimeToMinutes(timeString, isStart) {
    // Split the time string into hours, minutes, and period (AM/PM)
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':');

    // Convert hours and minutes to integers
    const hoursInt = parseInt(hours, 10);
    const minutesInt = parseInt(minutes, 10);

    // Calculate total minutes since midnight
    let totalMinutes = (hoursInt % 12) * 60 + minutesInt;

    // Adjust for PM period
    if (period.toUpperCase() === 'PM') {
        totalMinutes += 720;
    }

	if (!isStart && totalMinutes === 0) {
		totalMinutes = 1440;
	}

    return totalMinutes;
}


/**
 * Sets the start or end value of a slider based on a time input field's value, converting the time to minutes. This function
 * adjusts the slider's values to reflect the specified start or end time, ensuring the slider accurately represents the time range.
 *
 * @param {boolean} isStart: A flag indicating whether to update the start time or end time of the slider. If true, it updates
 * the start time based on the value from the "startTime" input field. If false, it updates the end time based on the value from
 * the "endTime" input field.
 */
function setSliderValues(isStart) {
	$(document).ready(function () {
		const currentValues = $("#ex2").slider('getValue');
		if (isStart) {
			eValue = currentValues[1];
			startValue = document.getElementById("startTime").value;
			newStartValue = convertTimeToMinutes(startValue, isStart);
			$("#ex2").slider('setValue', [newStartValue, eValue]);
		} else {
			sValue = currentValues[0];
			endValue = document.getElementById("endTime").value;
			newEndValue = convertTimeToMinutes(endValue, isStart);
			$("#ex2").slider('setValue', [sValue, newEndValue]);
		}
	});
};


/**
 * Attaches a "blur" event listener to an input field specified by `elementId`. This event triggers when the input field
 * loses focus, validating the time format entered by the user. Depending on the validation result, it either updates the
 * slider values to reflect the new time or displays an error message. The function dynamically handles both start and
 * end time input fields by determining which slider value to update based on the `elementId` argument. It also applies
 * or removes error styling based on the time format's validity.
 *
 * @param {string} elementId: The ID of the time input field to which the blur event listener will be attached. This function is designed
 * to work with both "startTime" and "endTime" input fields by adjusting its behavior based on the `elementId` provided.
 */
function addTimeBlurEventListener(elementId) {
    document.getElementById(elementId).addEventListener("blur", function () {
        const is_valid = validateTimeFormat(this.value);
        blockSetTimeButtons(is_valid);

        const timeElement = document.getElementById(elementId);
        const errorMessageElement = document.getElementById(elementId + "-error-message");

        if (is_valid) {
            timeElement.classList.remove("time-error");
            errorMessageElement.style.display = "none";
            setSliderValues(elementId === "startTime");
            const currentValues = $("#ex2").slider('getValue');
        } else {
            timeElement.classList.add("time-error");
            errorMessageElement.innerText = "Invalid format";
            errorMessageElement.style.display = "block";
        }
    });
}

// Apply the event listener to both startTime and endTime
addTimeBlurEventListener("startTime");
addTimeBlurEventListener("endTime");


/**
 * Validates a time string against a specific format ("HH:MM AM/PM") and checks if it represents a logical time range
 * when compared to another time value. The function uses a regular expression to validate the format of the time string
 * and then compares it against another time value (end time) to ensure the start time does not come after the end time,
 * except when the end time represents the start of a new day ("12:00 AM").
 *
 * @param {string} timeString: The time string to validate, expected in the format "HH:MM AM/PM".
 * @returns {boolean} is_valid: True if the time string matches the specified format and represents a logical time range;
 * otherwise, false.
 */
function validateTimeFormat(timeString) {
    // Regular expression for the specified format
    const timeRegex = /^(1[0-2]|0?[1-9]):[0-5][0-9] [APap][Mm]$/;
    let is_valid = timeRegex.test(timeString)
	const startTimeInput = document.getElementById("startTime").value;
	const endTimeInput = document.getElementById("endTime").value;
	const startTime = new Date(`2000-01-01 ${startTimeInput}`);
	const endTime = new Date(`2000-01-01 ${endTimeInput}`);
	if (is_valid) {
		if (endTimeInput !== '12:00 AM') {
			if (startTime.getTime() > endTime.getTime()) {
				is_valid = false;
			}
		}
	};
	return is_valid
};


/**
 * Modifies the enabled state, background color, and cursor style of wholeDayOff, outOfOffice, inOffice buttons based on
 * whether the input time is valid or not.
 *
 * @param {boolean} flag: A boolean flag indicating whether to enable or disable the buttons. If true, buttons are enabled;
 * if false, buttons are disabled.
 *
 * Note: This function uses global variables `wholeDayOff`, `outOfOffice` and `inOffice`.
 */
function blockSetTimeButtons(flag) {
    const settings = {
        disabled: !flag,
        backgroundColor: flag ? '#4285f4' : '#ccc',
        cursor: flag ? 'pointer' : 'default'
    };

    [wholeDayOff, outOfOffice, inOffice].forEach(element => {
        element.disabled = settings.disabled;
        element.style.backgroundColor = settings.backgroundColor;
        element.style.cursor = settings.cursor;
    });
};


function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60) % 12;
    const mins = minutes % 60;
    const period = Math.floor(minutes / 720) % 2 === 0 ? 'AM' : 'PM';

    const formattedHours = String(hours === 0 ? 12 : hours).padStart(2, "0");
    const formattedMins = String(mins).padStart(2, "0");

    return `${formattedHours}:${formattedMins} ${period}`;
}


/**
 * Updates the values of start and end time input fields based on given minute values by converting those minute values
 * into time strings. This function synchronizes slider values with input fields in a UI where users can select time
 * ranges either by moving a slider or by entering times directly into input fields.
 *
 * @param {HTMLElement} startTimeInput: The DOM element for the start time input field.
 * @param {HTMLElement} endTimeInput: The DOM element for the end time input field.
 * @param {number} value1: The start time value in minutes to be converted and displayed in the start time input field.
 * @param {number} value2: The end time value in minutes to be converted and displayed in the end time input field.
 */
function updateRangeFromInput(startTimeInput, endTimeInput, value1, value2) {
    startTimeInput.value = minutesToTime(value1);
    endTimeInput.value = minutesToTime(value2);
}


/**
 * Initializes a slider component for selecting start and end times, and synchronizes its values with corresponding input fields
 * for start and end times. This function sets up the slider with a formatter function that updates the start and end time input
 * fields whenever the slider values change. It also clears any error states from the start and end time input fields and ensures
 * that time setting buttons are enabled.
 */
let setTime = () => {
	const startTimeInput = document.getElementById("startTime");
	const endTimeInput = document.getElementById("endTime");

	$(document).ready(function () {
		$("#ex2").slider({
			formatter: function (values) {
				if (values[0] !== undefined && values[1] !== undefined) {
					updateRangeFromInput(startTimeInput, endTimeInput, values[0], values[1])
					document.getElementById("startTime").classList.remove("time-error");
        			document.getElementById("startTime-error-message").style.display = "none";
					document.getElementById("endTime").classList.remove("time-error");
        			document.getElementById("endTime-error-message").style.display = "none";
					blockSetTimeButtons(true);
				}
			}
		});
	});
}

document.addEventListener('DOMContentLoaded', function() {
    get_existing_unavailable_time();
});


/**
 * Fetches existing unavailable times from a local server endpoint and updates the global `selectedDates` array with these
 * time slots. After successfully retrieving and updating the unavailable times, it calls `setTime` to initialize or update time
 * selection UI components (like sliders) and `manipulate` to reflect the changes in the calendar or relevant UI.
 *
 * Note: This function uses global variable `selectedDates`
 */
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
        selectedDates = data.busy_times
        console.log(data);
        }
    setTime();
    manipulate();
    })
    .catch(error => console.error("Error:", error));
}


/**
 * Attaches a click event listener to the 'confirmButton' element. When clicked, this function collects the currently selected
 * dates from a global variable `selectedDates` and the chat ID from a Telegram user's data (`tg.initDataUnsafe.user.id`). It
 * then calls `sendDataToServer` with these collected dates and the chat ID as parameters.
 *
 * Note: This function uses global variable `selectedDates`
 */
confirmButton.addEventListener('click', function () {
    var dates = selectedDates;
    var chatId = tg.initDataUnsafe.user.id;
    sendDataToServer(dates, chatId);
});


/**
 * Submits an array of selected dates along with a chat ID to a server endpoint via a POST request. This function is designed
 * to work within the context of a Telegram Web App, where it can be used to send user-selected dates from a calendar UI to
 * a backend server for processing. After the data is sent and a response is received, it closeы the Telegram Web App interface.
 *
 * @param {Array} dates: An array containing the selected dates to be processed by the server.
 * @param {string} chatId: The chat ID associated with the current user session in the Telegram Web App, used to identify the user.
 */
function sendDataToServer(dates, chatId) {
    fetch('http://localhost:5000/process_dates', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            dates: dates, // Array of selected dates
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
