// apiService.js

// Define the base URL for your API.
// This assumes your backend server is running on localhost:3000.
// If your backend is on a different port or domain, update this accordingly.
const API_BASE = 'http://localhost:3000/api'; // Assuming your Express app runs on port 3000

/**
 * Retrieves the authentication token from local storage or session storage.
 * @returns {string|null} The authentication token if found, otherwise null.
 */
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

/**
 * A generic function to make API fetch requests.
 * It handles adding content type headers and authorization tokens.
 * @param {string} endpoint - The API endpoint (e.g., '/employees').
 * @param {Object} options - Fetch options (e.g., method, body, custom headers).
 * @returns {Promise<Object>} A promise that resolves to the JSON response data.
 * @throws {Error} If the API response is not successful or an error occurs during fetch.
 */
async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    options.headers = options.headers || {};
    // Ensure JSON content type for requests that have a body
    if (options.body && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
    }

    // Add Authorization header if a token exists
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Perform the fetch request to the full API URL
    const response = await fetch(API_BASE + endpoint, options);
    let data;

    // Attempt to parse the response as JSON
    try {
        // Check content-type header to ensure it's JSON before parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // If not JSON, but response.ok, it might be an expected non-JSON response (e.g., 204 No Content)
            // Or if not ok, it could be an HTML error page.
            // For now, we'll treat non-JSON as a potential issue if we expect JSON.
            data = { success: false, message: `Expected JSON, received ${contentType || 'no content type'}.` };
        }
    } catch (e) {
        // If JSON parsing fails (e.g., empty body, malformed JSON), return a generic error message
        data = { success: false, message: 'Invalid server response or empty response body.' };
    }

    // Check if the response was successful (HTTP status 2xx) or if the API returned success: false
    if (!response.ok || data.success === false) {
        // Throw an error with the message from the API or a generic one
        throw new Error(data.message || `API error occurred with status ${response.status}.`);
    }

    return data;
}

// --- API Functions for specific resources ---

/**
 * Fetches employee data from the API.
 * @param {Object} params - Query parameters for filtering employees (e.g., { department: 'IT', status: 'active' }).
 * @returns {Promise<Object>} Employee data.
 */
export async function getEmployees(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/employees?${query}`);
}

/**
 * Fetches department data from the API.
 * @returns {Promise<Object>} Department data.
 */
export async function getDepartments() {
    return apiFetch('/departments');
}

/**
 * Fetches monthly attendance data from the API.
 * This function also serves as the basis for the "summary" data,
 * as the backend's /attendance/monthly route provides aggregated info.
 * @param {Object} params - Query parameters for filtering monthly attendance (e.g., { month: '07', year: '2025' }).
 * @returns {Promise<Object>} Monthly attendance data.
 */
export async function getMonthlyAttendance(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/attendance/monthly?${query}`);
}

/**
 * Fetches daily attendance data from the API.
 * @param {Object} params - Query parameters for filtering daily attendance (e.g., { date: '2025-07-21' }).
 * @returns {Promise<Object>} Daily attendance data.
 */
export async function getDailyAttendance(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/attendance/daily?${query}`);
}

/**
 * Fetches monthly in/out records from the API.
 * @param {Object} params - Query parameters for filtering monthly in/out records.
 * @returns {Promise<Object>} Monthly in/out data.
 */
export async function getMonthlyInOut(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/attendance/monthly-inout?${query}`);
}

/**
 * Fetches late clock-in records from the API.
 * @param {Object} params - Query parameters for filtering late clock-in records.
 * @returns {Promise<Object>} Late clock-in data.
 */
export async function getLateClockIn(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/attendance/late-clockin?${query}`);
}

/**
 * Fetches overtime records from the API.
 * @param {Object} params - Query parameters for filtering overtime records.
 * @returns {Promise<Object>} Overtime data.
 */
export async function getOvertime(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/attendance/overtime?${query}`);
}

/**
 * Fetches summary attendance data from the API.
 * IMPORTANT: This now calls the /attendance/monthly endpoint, as that's where
 * aggregated data suitable for a summary is available from the backend.
 * It expects month and year parameters.
 * @param {Object} params - Query parameters for filtering summary data (month, year, department).
 * @returns {Promise<Object>} Summary data.
 */
export async function getSummary(params = {}) {
    // Ensure month and year are provided for the monthly endpoint
    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0'); // Current month (01-12)

    const effectiveParams = {
        month: params.month || currentMonth,
        year: params.year || currentYear,
        department: params.department || ''
    };

    const query = new URLSearchParams(effectiveParams).toString();
    // Changed endpoint to /attendance/monthly
    return apiFetch(`/attendance/monthly?${query}`);
}


/**
 * Fetches leave records from the API.
 * @param {Object} params - Query parameters for filtering leave records.
 * @returns {Promise<Object>} Leave data.
 */
export async function getLeaves(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/leaves?${query}`);
}

/**
 * Fetches holiday data from the API.
 * @param {Object} params - Query parameters for filtering holiday data.
 * @returns {Promise<Object>} Holiday data.
 */
export async function getHolidays(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/holidays?${query}`);
}

/**
 * Fetches work schedule data from the API.
 * @param {Object} params - Query parameters for filtering work schedule data.
 * @returns {Promise<Object>} Work schedule data.
 */
export async function getWorkSchedules(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/work_schedules?${query}`);
}
