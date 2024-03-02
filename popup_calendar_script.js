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
