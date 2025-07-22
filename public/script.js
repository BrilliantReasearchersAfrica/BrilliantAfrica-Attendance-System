// script.js
// Import all necessary functions from apiService.js
import {
  getEmployees,
  getDepartments,
  getMonthlyAttendance,
  getDailyAttendance,
  getMonthlyInOut,
  getLateClockIn,
  getOvertime,
  getSummary, // This will now fetch from /attendance/monthly
  getLeaves, // Assuming you might use these later
  getHolidays, // Assuming you might use these later
  getWorkSchedules // Assuming you might use these later
} from './apiService.js';

/**
 * Shows a specific content section and updates active navigation links.
 * @param {string} section - The ID prefix of the section to show (e.g., 'employees', 'monthly').
 */
function showSection(section) {
  // Hide all content sections
  document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
  // Deactivate all sidebar navigation links
  document.querySelectorAll('.sidebar a').forEach(link => link.classList.remove('active'));

  // Activate the selected content section
  const targetSection = document.getElementById(section + '-section');
  if (targetSection) {
    targetSection.classList.add('active');
  } else {
    console.error(`Section with ID '${section}-section' not found.`);
    return; // Exit if section not found to prevent further errors
  }

  // Activate the corresponding sidebar navigation link
  const navLink = document.getElementById('nav-' + section);
  if (navLink) {
    navLink.classList.add('active');
  } else {
    console.warn(`Navigation link with ID 'nav-${section}' not found.`);
  }

  // Load data specific to the activated section
  switch (section) {
    case 'employees':
      loadEmployees();
      break;
    case 'daily':
      loadDailyAttendance();
      break;
    case 'monthly':
      loadMonthlyAttendance();
      break;
    case 'monthly-inout':
      loadMonthlyInOut();
      break;
    case 'late-clockin':
      loadLateClockIn();
      break;
    case 'overtime':
      loadOvertime();
      break;
    case 'summary':
      loadSummary(); // This will now fetch from /attendance/monthly
      break;
      // Add more cases for other sections if needed (e.g., 'leaves', 'holidays', 'work-schedules')
  }
}

/**
 * Handles the logout process by removing the token and redirecting to the login page.
 */
function logout() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token'); // Also clear session storage if used
  window.location.href = '../public/login.html'; // Adjust path if necessary
}

/**
 * Displays an error message in a table body.
 * @param {string} msg - The error message to display.
 * @param {string} tbodyId - The ID of the table body element where the message should be displayed.
 */
function showError(msg, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="100%" class="error-message">${msg}</td></tr>`;
  } else {
    console.error(`Error: Table body with ID '${tbodyId}' not found.`);
  }
}

/**
 * Displays an error message in a general purpose div.
 * @param {string} msg - The error message to display.
 * @param {string} elementId - The ID of the element where the message should be displayed.
 */
function showGeneralError(msg, elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = msg;
    element.style.display = 'block'; // Make sure the element is visible
  } else {
    console.error(`Error: Element with ID '${elementId}' not found for general error display.`);
  }
}

/**
 * Hides a general purpose error message div.
 * @param {string} elementId - The ID of the element to hide.
 */
function hideGeneralError(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = 'none';
    element.textContent = ''; // Clear content
  }
}


// --- Data Loading Functions for Each Section ---

/**
 * Loads employee data based on filters and populates the employees table.
 */
async function loadEmployees() {
  hideGeneralError('employeeErrorMessage'); // Hide previous errors
  try {
    const department = document.getElementById('employeeDepartmentFilter')?.value || '';
    const status = document.getElementById('employeeStatusFilter')?.value || '';
    const search = document.getElementById('employeeSearchFilter')?.value || '';

    // Use the imported getEmployees function
    const result = await getEmployees({
      department,
      status,
      search
    });
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) {
      console.error('employeesTableBody not found.');
      return;
    }
    tbody.innerHTML = ''; // Clear previous data

    if (result.success && result.data && result.data.length) {
      result.data.forEach(emp => {
        tbody.innerHTML += `
          <tr>
            <td>${emp.employee_code || '-'}</td>
            <td>${emp.name}</td>
            <td>${emp.email}</td>
            <td>${emp.department_name || '-'}</td>
            <td>${emp.position || '-'}</td>
            <td>${emp.hire_date || '-'}</td>
            <td><span class="badge ${emp.status === 'active' ? 'bg-success' : 'bg-secondary'}">${emp.status}</span></td>
            <td>
              <button class="btn btn-sm btn-info" onclick="viewEmployee(${emp.id})"><i class="fas fa-eye"></i></button>
            </td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center">No employees found</td></tr>`;
    }
  } catch (error) {
    console.error('Failed to load employees:', error);
    showGeneralError('Failed to load employees: ' + error.message, 'employeeErrorMessage');
    showError('Failed to load employees: ' + error.message, 'employeesTableBody'); // Fallback for table-specific error
  }
}

/**
 * Loads daily attendance data based on filters and populates the daily attendance table.
 */
window.loadDailyAttendance = async function () {
  const department = document.getElementById('dailyDepartmentFilter').value;
  const date = document.getElementById('dailyDateFilter').value;
  const tbody = document.getElementById('dailyAttendanceTableBody');

  console.log(`Loading daily attendance for department: ${department}, date: ${date}`);
  // Clear existing rows
  tbody.innerHTML = '';

  try {
    // Using the imported getDailyAttendance function
    const result = await getDailyAttendance({ department, date });

    if (result.success && result.data && result.data.length) {
      result.data.forEach((record, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${record.name}</td>
          <td>${record.employee_code || ''}</td>
          <td>${record.department_name || ''}</td>
          <td>${record.clock_in || ''}</td>
          <td>${record.clock_out || ''}</td>
          <td>${record.hours_worked || ''}</td>
          <td>${record.status || ''}</td>
          <td>${record.punctuality || ''}</td>
        `;
      });
    } else {
      const row = tbody.insertRow();
      const cell = row.insertCell(0);
      cell.colSpan = 9; // Updated colspan to match table headers
      cell.classList.add('text-center', 'text-muted');
      cell.textContent = 'No attendance records found for the selected filters.';
    }
  } catch (error) {
    console.error('Error loading daily attendance:', error);
    const row = tbody.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = 9; // Updated colspan
    cell.classList.add('text-center', 'text-danger');
    cell.textContent = 'An error occurred while loading attendance data.';
  }
};

/**
 * Loads monthly attendance data based on filters and populates the monthly attendance table.
 */
async function loadMonthlyAttendance() {
  hideGeneralError('monthlyAttendanceErrorMessage'); // Hide previous errors
  try {
    const monthFilter = document.getElementById('monthlyMonthFilter');
    const departmentFilter = document.getElementById('monthlyDepartmentFilter');

    if (!monthFilter || !monthFilter.value) {
      showGeneralError('Please select a month for monthly attendance.', 'monthlyAttendanceErrorMessage');
      showError('Please select a month for monthly attendance.', 'monthlyAttendanceTableBody');
      return;
    }

    const [year, month] = monthFilter.value.split('-');
    const department = departmentFilter ? departmentFilter.value : '';

    // Use the imported getMonthlyAttendance function
    const result = await getMonthlyAttendance({
      month,
      year,
      department
    });
    const tbody = document.getElementById('monthlyAttendanceTableBody');
    if (!tbody) {
      console.error('monthlyAttendanceTableBody not found.');
      return;
    }
    tbody.innerHTML = '';

    if (result.success && result.data && result.data.length) {
      result.data.forEach(employee => {
        tbody.innerHTML += `
          <tr>
            <td><i class="fas fa-user-circle"></i> ${employee.name}</td>
            <td>${employee.department}</td>
            <td>${employee.present_days}</td>
            <td>${employee.absent_days}</td>
            <td>${employee.half_days}</td>
            <td>${employee.weekend_work}</td>
            <td>${employee.avg_hours}</td>
            <td>${employee.total_overtime}</td>
            <td>${employee.attendance_percent}%</td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center">No data available</td></tr>`;
    }
  } catch (error) {
    console.error('Failed to load monthly attendance:', error);
    showGeneralError('Failed to load monthly attendance: ' + error.message, 'monthlyAttendanceErrorMessage');
    showError('Failed to load monthly attendance: ' + error.message, 'monthlyAttendanceTableBody');
  }
}

/**
 * Loads monthly in/out records based on filters and populates the monthly in/out table.
 */
async function loadMonthlyInOut() {
  hideGeneralError('monthlyInOutErrorMessage'); // Hide previous errors
  try {
    const monthFilter = document.getElementById('monthlyInOutMonthFilter');
    const departmentFilter = document.getElementById('monthlyInOutDepartmentFilter');

    if (!monthFilter || !monthFilter.value) {
      showGeneralError('Please select a month for monthly in/out report.', 'monthlyInOutErrorMessage');
      showError('Please select a month for monthly in/out report.', 'monthlyInOutTableBody');
      return;
    }

    const [year, month] = monthFilter.value.split('-');
    const department = departmentFilter ? departmentFilter.value : '';

    // Use the imported getMonthlyInOut function
    const result = await getMonthlyInOut({
      month,
      year,
      department
    });
    const tbody = document.getElementById('monthlyInOutTableBody');
    if (!tbody) {
      console.error('monthlyInOutTableBody not found.');
      return;
    }
    tbody.innerHTML = '';

    if (result.success && result.data && result.data.length) {
      result.data.forEach(row => {
        tbody.innerHTML += `
          <tr>
            <td>${row.date}</td>
            <td>${row.employee}</td>
            <td>${row.department}</td>
            <td>${row.clock_in}</td>
            <td>${row.clock_out}</td>
            <td>${row.hours_worked}</td>
            <td>${row.status}</td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center">No data available</td></tr>`;
    }
  } catch (error) {
    console.error('Failed to load monthly in/out report:', error);
    showGeneralError('Failed to load monthly in/out report: ' + error.message, 'monthlyInOutErrorMessage');
    showError('Failed to load monthly in/out report: ' + error.message, 'monthlyInOutTableBody');
  }
}

/**
 * Loads late clock-in records based on filters and populates the late clock-in table.
 */
async function loadLateClockIn() {
  hideGeneralError('lateClockInErrorMessage'); // Hide previous errors
  try {
    const dateFilter = document.getElementById('lateClockInDateFilter');
    const monthFilter = document.getElementById('lateClockInMonthFilter');
    const departmentFilter = document.getElementById('lateClockInDepartmentFilter');

    const date = dateFilter ? dateFilter.value : '';
    const month = monthFilter && monthFilter.value ? monthFilter.value.split('-')[1] : '';
    const year = monthFilter && monthFilter.value ? monthFilter.value.split('-')[0] : '';
    const department = departmentFilter ? departmentFilter.value : '';

    if (!date && (!month || !year)) {
      showGeneralError('Please select a date or month/year for late clock-in report.', 'lateClockInErrorMessage');
      showError('Please select a date or month/year for late clock-in report.', 'lateClockInTableBody');
      return;
    }

    // Use the imported getLateClockIn function
    const result = await getLateClockIn({
      date,
      month,
      year,
      department
    });
    const tbody = document.getElementById('lateClockInTableBody');
    if (!tbody) {
      console.error('lateClockInTableBody not found.');
      return;
    }
    tbody.innerHTML = '';

    if (result.success && result.data && result.data.length) {
      result.data.forEach(item => {
        // Note: Backend attendanceRoutes.js returns 'clock_in' not 'clock_in_time'
        // Adjusting to use 'clock_in' from the backend response.
        tbody.innerHTML += `
          <tr>
            <td>${item.date}</td>
            <td>${item.employee}</td>
            <td>${item.department}</td>
            <td>${item.clock_in}</td>
            <td>${item.late_by}</td>
            <td>${item.hours_worked}</td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">No data available</td></tr>`;
    }
  } catch (error) {
    console.error('Failed to load late clock-in:', error);
    showGeneralError('Failed to load late clock-in: ' + error.message, 'lateClockInErrorMessage');
    showError('Failed to load late clock-in: ' + error.message, 'lateClockInTableBody');
  }
}

/**
 * Loads overtime records based on filters and populates the overtime table.
 */
async function loadOvertime() {
  hideGeneralError('overtimeErrorMessage'); // Hide previous errors
  try {
    const monthFilter = document.getElementById('overtimeMonthFilter');
    const departmentFilter = document.getElementById('overtimeDepartmentFilter');

    if (!monthFilter || !monthFilter.value) {
      showGeneralError('Please select a month for overtime report.', 'overtimeErrorMessage');
      showError('Please select a month for overtime report.', 'overtimeTableBody');
      return;
    }

    const [year, month] = monthFilter.value.split('-');
    const department = departmentFilter ? departmentFilter.value : '';

    // Use the imported getOvertime function
    const result = await getOvertime({
      month,
      year,
      department
    });
    const tbody = document.getElementById('overtimeTableBody');
    if (!tbody) {
      console.error('overtimeTableBody not found.');
      return;
    }
    tbody.innerHTML = '';

    if (result.success && result.data && result.data.length) {
      result.data.forEach(item => {
        tbody.innerHTML += `
          <tr>
            <td>${item.date}</td>
            <td>${item.employee}</td>
            <td>${item.department}</td>
            <td>${item.regular_hours}</td>
            <td>${item.overtime_hours}</td>
            <td>${item.total_hours}</td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">No data available</td></tr>`;
    }
  } catch (error) {
    console.error('Failed to load overtime report:', error);
    showGeneralError('Failed to load overtime report: ' + error.message, 'overtimeErrorMessage');
    showError('Failed to load overtime report: ' + error.message, 'overtimeTableBody');
  }
}

/**
 * Loads department data and populates department filter dropdowns.
 */
async function loadDepartments() {
  try {
    // Use the imported getDepartments function
    const result = await getDepartments();
    if (result.success && result.data) {
      const filters = [
        'monthlyDepartmentFilter',
        'dailyDepartmentFilter',
        'summaryDepartmentFilter',
        'employeeDepartmentFilter',
        'monthlyInOutDepartmentFilter',
        'lateClockInDepartmentFilter',
        'overtimeDepartmentFilter'
      ];
      filters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) {
          select.innerHTML = '<option value="">All Departments</option>'; // Add 'All' option
          result.data.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.id;
            option.textContent = dept.name;
            select.appendChild(option);
          });
        }
      });
    }
  } catch (error) {
    console.warn('Error loading departments:', error);
    // No specific UI element for department loading errors, so just log.
  }
}

/**
 * Loads summary attendance data and updates the summary display.
 * This now fetches data from the /attendance/monthly endpoint.
 */
async function loadSummary() {
  hideGeneralError('summaryErrorMessage'); // Hide previous errors
  try {
    const departmentFilter = document.getElementById('summaryDepartmentFilter');
    const department = departmentFilter ? departmentFilter.value : '';

    // Get current month and year for the summary, or allow selection if filters are present
    const today = new Date();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = today.getFullYear().toString();

    // Use the imported getSummary function, which now calls /attendance/monthly
    const result = await getSummary({
      month: currentMonth, // Pass current month
      year: currentYear,   // Pass current year
      department
    });

    // Initialize totals
    let totalEmployees = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalHalfDays = 0;
    let totalPossibleDays = 0; // To calculate average attendance

    if (result.success && result.data && result.data.length) {
      // Aggregate data from the monthly summary for overall dashboard summary
      result.data.forEach(employeeSummary => {
        totalEmployees++; // Each entry represents an employee
        totalPresent += employeeSummary.present_days;
        totalAbsent += employeeSummary.absent_days;
        totalHalfDays += employeeSummary.half_days;
        // Assuming a standard work month for simplicity, or you could fetch total working days
        // For a true "today" summary, you'd need a separate API endpoint.
        // This current implementation provides a monthly overview as "summary".
        // If you need "presentToday", "absentToday", you'll need a new backend endpoint.
        // For now, let's calculate an overall attendance percentage for the month.
        totalPossibleDays += (employeeSummary.present_days + employeeSummary.absent_days + employeeSummary.half_days);
      });

      const avgAttendance = totalPossibleDays > 0 ? ((totalPresent + (totalHalfDays * 0.5)) / totalPossibleDays * 100).toFixed(2) : 0;

      // Update the display elements
      document.getElementById('totalEmployees').textContent = totalEmployees;
      // Note: 'presentToday' and 'absentToday' are not directly available from /monthly endpoint.
      // You'd need a separate /attendance/daily?date=TODAY endpoint for that.
      // For now, setting them to 'N/A' or repurposing to monthly totals.
      // Let's repurpose them to monthly totals for demonstration.
      document.getElementById('presentToday').textContent = totalPresent; // Repurposed as Monthly Present
      document.getElementById('absentToday').textContent = totalAbsent;   // Repurposed as Monthly Absent
      document.getElementById('avgAttendance').textContent = `${avgAttendance}%`;

    } else {
      console.warn('No summary data available or API call failed:', result);
      document.getElementById('totalEmployees').textContent = '0';
      document.getElementById('presentToday').textContent = '0';
      document.getElementById('absentToday').textContent = '0';
      document.getElementById('avgAttendance').textContent = '0%';
    }
  } catch (error) {
    console.error('Error loading summary:', error);
    // Use the new general error display function for the summary section
    showGeneralError('Failed to load summary: ' + error.message, 'summaryErrorMessage');
    // Also reset stats on error
    document.getElementById('totalEmployees').textContent = 'N/A';
    document.getElementById('presentToday').textContent = 'N/A';
    document.getElementById('absentToday').textContent = 'N/A';
    document.getElementById('avgAttendance').textContent = 'N/A';
  }
}


// --- Global Exposure and Initial Load ---

// Expose functions to the global window object so they can be called from inline HTML attributes.
// This is necessary because modules scope their contents by default.
window.showSection = showSection;
window.logout = logout;
window.exportData = exportData; // Assuming this is called from HTML
window.viewEmployee = viewEmployee; // Assuming this is called from HTML
window.showAddEmployeeModal = showAddEmployeeModal; // Assuming this is called from HTML

// Dummy function for export buttons
function exportData(section) {
  // Replace with actual export logic (e.g., generating a CSV or PDF)
  alert('Export for ' + section + ' not implemented yet.');
}

// Dummy function for employee view modal/page
function viewEmployee(id) {
  // Replace with actual logic to show employee details
  alert('View employee #' + id + ' not implemented yet.');
}

// Dummy function for add employee modal
function showAddEmployeeModal() {
  // Replace with actual logic to show an add employee form/modal
  alert('Add employee modal not implemented yet.');
}

/**
 * Checks if a user is authenticated (has a token).
 * If not, redirects them to the login page.
 */
function checkAuthentication() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    // You might also want to add logic here to validate the token with your backend
    // For now, a simple presence check is sufficient for redirection.
    if (!token) {
        console.warn('No authentication token found. Redirecting to login page.');
        window.location.href = '../public/login.html'; // Adjust path if necessary
    }
}


// Initialize the application once the DOM is fully loaded
window.onload = function() {
    checkAuthentication(); // <--- This is the crucial line for enforcing login
    loadDepartments(); // Load departments for filters
    showSection('monthly'); // Show the default section
};

// daily attendace
function loadDailyAttendance(){
    // This function seems to be defined twice. The async version above
    // that fetches data is likely the one you want to use.
    // The content 'const document = window.document;' is not doing anything useful here.
}