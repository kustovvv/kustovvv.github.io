let tg = window.Telegram.WebApp;

// tg.expand()

tg.MainButton.textColor = "#FFFFFF";
tg.MainButton.color = "#2cab37";

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

let selectedDates = [{date: 'Fri Dec 29 2023 00:00:00 GMT+0200 (Eastern European Standard Time)', time: '04:10 AM-07:50 PM'},
					{date: 'Thu Jan 18 2024 00:00:00 GMT+0200 (Eastern European Standard Time)', time: ['12:00 AM-04:10 AM', '07:50 PM-12:00 AM']},
					{date: 'Tue Jan 16 2024 00:00:00 GMT+0200 (Eastern European Standard Time)', time: '04:10 AM-07:50 PM'},
					{date: 'Thu Feb 01 2024 00:00:00 GMT+0200 (Eastern European Standard Time)', time: '12:00 AM-12:00 AM'},
];
let clickedDates = [];
let deleteDates = [];
let startDate = -1;
let endDate;

// Function to generate the calendar
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
		// Loop to add the last dates of the previous month
		for (let i = dayone; i > 0; i--) {
			lit +=`<li class="inactive">${monthlastdate - i + 1}</li>`;
		}

		// Loop to add the dates of the current month
		for (let i = 1; i <= lastdate; i++) {
			// Check if the current day is in selectedDates
			let isActive = selectedDates.some(selectedDate => {
				const selectedDateObj = new Date(selectedDate.date);
				return selectedDateObj.getDate() === i && 
						selectedDateObj.getMonth() === month && 
						selectedDateObj.getFullYear() === year;
			});
			
			let isClicked = clickedDates.some(clickedDates => 
											clickedDates.getDate() === i && 
											clickedDates.getMonth() === month && 
											clickedDates.getFullYear() === year);
			
			let isFullBlocked = selectedDates.some(selectedDate => {
				const selectedDateObj = new Date(selectedDate.date);
				return selectedDateObj.getDate() === i && 
						selectedDateObj.getMonth() === month && 
						selectedDateObj.getFullYear() === year && 
						selectedDate.time === '12:00 AM-12:00 AM';
			});

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
	} else {		
		// Loop to add the last dates of the previous month
		for (let i = dayone; i > 0; i--) {
			lit +=`<li class="inactive">${monthlastdate - i + 1}</li>`;
		}

		// Loop to add the dates of the current month
		for (let i = 1; i <= lastdate; i++) {
			// Check if the current day is in selectedDates
			let blockedDays = selectedDates.filter(selectedDate => {
				const selectedDateObj = new Date(selectedDate.date);
				return selectedDateObj.getDate() == i && 
						selectedDateObj.getMonth() == month && 
						selectedDateObj.getFullYear() == year;
			});
						
			if (blockedDays.length > 0) {
				const blockedDay = blockedDays[0];
				if (blockedDay.time === '12:00 AM-12:00 AM') {
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
		};
	

	// Update the text of the current date element 
	// with the formatted current month and year
	currdate.innerText = `${months[month]} ${year}`;

	// update the HTML of the dates element 
	// with the generated calendar
	day.innerHTML = lit;

	// Select all the days in the calendar
    const days = document.querySelectorAll(".calendar-dates li");


	const handleDayClick = (dayElement, index) => {
		// Update the date variable with the clicked day
		let day_index = index - dayone;
		date = new Date(year, month, day_index+1);

		if (!is_show_hours) {
			dayElement.classList.toggle("clicked");
		}
		
		if (is_select_range) {
			if (dayElement.classList.contains("clicked")) {
				startDate = startDate === -1 ? date : startDate;
				endDate = date;
				if (startDate > endDate) {
					let temp = startDate;
					startDate = endDate;
					endDate = temp;
				}
				const daysToAdd = Math.abs((endDate - startDate) / (24 * 60 * 60 * 1000));
				
				for (let i = 0; i <= daysToAdd; i++) {
					const currentDate = new Date(startDate);
					currentDate.setDate(startDate.getDate() + i);
					clickedDates.push(currentDate);
				}

				clickedDates.forEach(clickedDate => {
					const dayIndex = clickedDate.getDate() + dayone - 1;
					if (clickedDate.getMonth() === month && clickedDate.getFullYear() === year) {
						const dayElement = document.querySelector(`.calendar-dates li:nth-child(${dayIndex + 1})`);
						dayElement.classList.add("clicked");	
					}
				});

				if (startDate !== endDate) {
					startDate = -1;
				}

			} else {
				// Remove the date from the selectedDates array if it's no longer active
				clickedDates = clickedDates.filter(clickedDates => clickedDates.getTime() !== date.getTime());
				startDate = -1;
			}
		} else {
			if (dayElement.classList.contains("clicked")) {
				clickedDates.push(date);
				if (dayElement.classList.contains("active") || dayElement.classList.contains("fullBlocked")) {
					deleteDates.push(date);
				}
			} else {
				// Remove the date from the selectedDates array if it's no longer active
				clickedDates = clickedDates.filter(clickedDates => clickedDates.getTime() !== date.getTime());
			};
		}

		if (clickedDates.length === 0) {
			cancelRange.classList.add("hidden");
			deleteRange.classList.add("hidden");
		} else {
			cancelRange.classList.remove("hidden");
			deleteRange.classList.remove("hidden");
		}
	}

    // Attach a click event listener to each day
    days.forEach((dayElement, index) => {
		dayElement.addEventListener("click", function (event) {
			event.preventDefault();
			handleDayClick(dayElement, index);
        });
    });

	function removeFromClicked(date) {
		clickedDates = clickedDates.filter(clickedDates => clickedDates.getTime() !== date.getTime());
	}

	function removeFromSelected(dateToRemove) {
		selectedDates = selectedDates.filter(selectedDate => {
			const selectedDateObj = new Date(selectedDate.date);
			return (
				selectedDateObj.getTime() !== dateToRemove.getTime()
			);
		});
	}

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

	function updateAvailableTime(dateToUpdate, newFrom, newTo) {
		const indexToUpdate = getDateIndexToUpdate(dateToUpdate);
		if (indexToUpdate !== -1) {
			// Update the 'from-to' value for the matching date
			selectedDates[indexToUpdate].date = `${dateToUpdate}`;
			selectedDates[indexToUpdate].time = [`${'12:00 AM'}-${newFrom}`, `${newTo}-${'12:00 AM'}`];
		} else {
			// Handle the case where the date is not found
			let dateObj = {
				date: `${dateToUpdate}`,
				time:  [`${'12:00 AM'}-${newFrom}`, `${newTo}-${'12:00 AM'}`]
			};
			selectedDates.push(dateObj);	
		}
	}

	function clearAllClicked() {
		const days = document.querySelectorAll(".calendar-dates li");
		days.forEach(day => {
			if (day.classList.contains("clicked")) {
				day.classList.remove("clicked");
				day.classList.remove("active");
				day.classList.remove("fullBlocked");
			}
		});
		cancelRange.classList.add("hidden");
		deleteRange.classList.add("hidden");
	}

	function changeAllClickedToFullBlocked() {
		const days = document.querySelectorAll(".calendar-dates li");
		days.forEach(day => {
			if (day.classList.contains("clicked")) {
				day.classList.remove("clicked");
				day.classList.remove("active");
				day.classList.add("fullBlocked");
			}
		});
		cancelRange.classList.add("hidden");
	}

	function changeAllClickedToSelected() {
		const days = document.querySelectorAll(".calendar-dates li");
		days.forEach(day => {
			if (day.classList.contains("clicked")) {
				day.classList.remove("clicked");
				day.classList.remove("fullBlocked");
				day.classList.add("active");
			}
		});
		cancelRange.classList.add("hidden");
	}
	
	wholeDayOff.addEventListener('click', function () {
		$("#ex2").slider('setValue', [0, 1440]);
		startTime = document.getElementById("startTime").value;
		endTime = document.getElementById("endTime").value;
		clickedDates.forEach(date => {
			updateUnavailableTime(date, startTime, endTime);
			removeFromClicked(date);
		});
		changeAllClickedToFullBlocked();
		console.log(selectedDates);
	});
	
	outOfOffice.addEventListener('click', function () {
		startTime = document.getElementById("startTime").value;
		endTime = document.getElementById("endTime").value;
		clickedDates.forEach(date => {
			updateUnavailableTime(date, startTime, endTime);
			removeFromClicked(date);
		});
		if (startTime === '12:00 AM' && endTime === '12:00 AM') {
			changeAllClickedToFullBlocked();
		} else {
			changeAllClickedToSelected();
		}
		console.log(selectedDates);
	});

	inOffice.addEventListener('click', function () {
		startTime = document.getElementById("startTime").value;
		endTime = document.getElementById("endTime").value;
		clickedDates.forEach(date => {
			updateAvailableTime(date, startTime, endTime);
			removeFromClicked(date);
		});
		changeAllClickedToSelected();
		console.log(selectedDates);
	});

	selectRange.addEventListener('click', function() {
		selectIndividualDays.style.backgroundColor = "#ccc";
		selectRange.style.backgroundColor = "#4285f4";
		is_select_range = true;
		startDate = -1;
	});

	selectIndividualDays.addEventListener('click', function() {
		selectRange.style.backgroundColor = "#ccc";
		selectIndividualDays.style.backgroundColor = "#4285f4";
		is_select_range = false;
	});

	deleteRange.addEventListener('click', function() {
		clickedDates.forEach(date => {
			removeFromSelected(date);
			removeFromClicked(date)
		});
		clearAllClicked()
		deleteRange.classList.add("hidden");
		cancelRange.classList.add("hidden");
		startDate = -1;
	});

	cancelRange.addEventListener('click', function() {
		clickedDates = [];
		const days = document.querySelectorAll(".calendar-dates li");
		days.forEach(day => {
			if (day.classList.contains("clicked")) {
				day.classList.remove("clicked");
			}
		});
		deleteRange.classList.add("hidden");
		cancelRange.classList.add("hidden");
		startDate = -1;
	});
}

showDates.addEventListener('click', function() {
	showHours.style.backgroundColor = "#ccc";
	showDates.style.backgroundColor = "#4285f4";
	is_show_hours = false;
	manipulate();
});

showHours.addEventListener('click', function() {
	showDates.style.backgroundColor = "#ccc";
	showHours.style.backgroundColor = "#4285f4";
	is_show_hours = true;
	manipulate();
});


// Attach a click event listener to each icon
prenexIcons.forEach(icon => {
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
		manipulate();
	});
});

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

document.getElementById("startTime").addEventListener("blur", function () {
    is_valid = validateTimeFormat(this.value);
	blockSetTimeButtons(is_valid);
	if (is_valid) {
        document.getElementById("startTime").classList.remove("time-error");
        document.getElementById("startTime-error-message").style.display = "none";
		setSliderValues(true);
		$(document).ready(function () {
			const currentValues = $("#ex2").slider('getValue');
		});
    } else {
        document.getElementById("startTime").classList.add("time-error");
        document.getElementById("startTime-error-message").innerText = "Invalid format";
        document.getElementById("startTime-error-message").style.display = "block";
    }
});


document.getElementById("endTime").addEventListener("blur", function () {
    is_valid = validateTimeFormat(this.value);
	blockSetTimeButtons(is_valid);
	if (is_valid) {
        document.getElementById("endTime").classList.remove("time-error");
        document.getElementById("endTime-error-message").style.display = "none";
		setSliderValues(false);
		$(document).ready(function () {
			const currentValues = $("#ex2").slider('getValue');
		});
    } else {
		document.getElementById("endTime").classList.add("time-error");
        document.getElementById("endTime-error-message").innerText = "Invalid format";
        document.getElementById("endTime-error-message").style.display = "block";
    }
});


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

function blockSetTimeButtons(flag) {
	if (!flag) {
		wholeDayOff.disabled = true;
		wholeDayOff.style.backgroundColor = '#ccc';
		wholeDayOff.style.cursor = 'default';

		outOfOffice.disabled = true;
		outOfOffice.style.backgroundColor = '#ccc';
		outOfOffice.style.cursor = 'default';

		inOffice.disabled = true;
		inOffice.style.backgroundColor = '#ccc';
		inOffice.style.cursor = 'default';
	} else {
		wholeDayOff.disabled = false;
		wholeDayOff.style.backgroundColor = '#4285f4';
		wholeDayOff.style.cursor = 'pointer';

		outOfOffice.disabled = false;
		outOfOffice.style.backgroundColor = '#4285f4';
		outOfOffice.style.cursor = 'pointer';

		inOffice.disabled = false;
		inOffice.style.backgroundColor = '#4285f4';
		inOffice.style.cursor = 'pointer';
	};
};


let setTime = () => {
	const startTimeInput = document.getElementById("startTime");
	const endTimeInput = document.getElementById("endTime");

	function updateRangeFromInput(value1, value2) {
		startTimeInput.value = minutesToTime(value1);
		endTimeInput.value = minutesToTime(value2);
	}

	function minutesToTime(minutes) {
		const hours = Math.floor(minutes / 60) % 12;
		const mins = minutes % 60;
		const period = Math.floor(minutes / 720) % 2 === 0 ? 'AM' : 'PM';
	
		const formattedHours = String(hours === 0 ? 12 : hours).padStart(2, "0");
		const formattedMins = String(mins).padStart(2, "0");
	
		return `${formattedHours}:${formattedMins} ${period}`;
	}

	$(document).ready(function () {
		$("#ex2").slider({
			formatter: function (values) {
				if (values[0] !== undefined && values[1] !== undefined) {
					updateRangeFromInput(values[0], values[1])
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

confirmButton.addEventListener('click', function () {
//	console.log(selectedDates);
//    tg.sendData(JSON.stringify(selectedDates));
//    tg.expand();
    var dates = selectedDates;
    var chatId = `${tg.initDataUnsafe.user.id}`;
    sendDataToServer(dates, chatId);
});

// Sending out data
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
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}

// const mainButton = window.Telegram.WebApp.MainButton;
// mainButton.setText("Date send");
// mainButton.enable();
// mainButton.show();	

// mainButton.onClick(function(event){
// 	event.preventDefault();
// 	window.Telegram.WebApp.sendData("Send data with Main button");
// 	event.preventDefault();
// });


setTime();
manipulate();

let showdate = document.getElementById("showdate");
let p = document.createElement("p")

// p.innerText = `${tg.initDataUnsafe.user.first_name} ${tg.initDataUnsafe.user.last_name} ${tg.initDataUnsafe.user.id}`;

showdate.appendChild(p)
