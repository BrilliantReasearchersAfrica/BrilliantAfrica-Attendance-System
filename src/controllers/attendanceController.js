const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

class AttendanceController {
  static async getMonthlyAttendance(req, res) {
    try {
      const { month, year, department } = req.query;
      
      const currentDate = new Date();
      const targetMonth = month || (currentDate.getMonth() + 1);
      const targetYear = year || currentDate.getFullYear();
      
      const departmentId = department ? parseInt(department) : null;
      
      const attendanceData = await Employee.getMonthlyAttendance(
        parseInt(targetMonth), 
        parseInt(targetYear), 
        departmentId
      );
      
      res.json({
        success: true,
        data: attendanceData,
        month: targetMonth,
        year: targetYear
      });
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching attendance data',
        error: error.message
      });
    }
  }

  static async getDepartments(req, res) {
    try {
      const departments = await Department.getAll();
      res.json({
        success: true,
        data: departments
      });
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching departments',
        error: error.message
      });
    }
  }

  static async getEmployees(req, res) {
    try {
      const { department } = req.query;
      const employees = await Employee.getAll(department);
      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching employees',
        error: error.message
      });
    }
  }

  static async getDailyAttendance(req, res) {
    try {
      const { date, department } = req.query;
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const attendanceData = await Attendance.getDailyAttendance(targetDate, department);
      
      res.json({
        success: true,
        data: attendanceData,
        date: targetDate
      });
    } catch (error) {
      console.error('Error fetching daily attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching daily attendance',
        error: error.message
      });
    }
  }

  static async getMonthlyInOut(req, res) {
    try {
      const { month, year, employee } = req.query;
      
      const currentDate = new Date();
      const targetMonth = month || (currentDate.getMonth() + 1);
      const targetYear = year || currentDate.getFullYear();
      
      const inOutData = await Attendance.getMonthlyInOut(
        parseInt(targetMonth), 
        parseInt(targetYear), 
        employee
      );
      
      res.json({
        success: true,
        data: inOutData,
        month: targetMonth,
        year: targetYear
      });
    } catch (error) {
      console.error('Error fetching monthly in-out data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching in-out data',
        error: error.message
      });
    }
  }

  static async getLateClockIn(req, res) {
    try {
      const { month, year, department } = req.query;
      
      const currentDate = new Date();
      const targetMonth = month || (currentDate.getMonth() + 1);
      const targetYear = year || currentDate.getFullYear();
      
      const lateData = await Attendance.getLateClockIn(
        parseInt(targetMonth), 
        parseInt(targetYear), 
        department
      );
      
      res.json({
        success: true,
        data: lateData,
        month: targetMonth,
        year: targetYear
      });
    } catch (error) {
      console.error('Error fetching late clock-in data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching late clock-in data',
        error: error.message
      });
    }
  }

  static async getOvertime(req, res) {
    try {
      const { month, year, department } = req.query;
      
      const currentDate = new Date();
      const targetMonth = month || (currentDate.getMonth() + 1);
      const targetYear = year || currentDate.getFullYear();
      
      const overtimeData = await Attendance.getOvertime(
        parseInt(targetMonth), 
        parseInt(targetYear), 
        department
      );
      
      res.json({
        success: true,
        data: overtimeData,
        month: targetMonth,
        year: targetYear
      });
    } catch (error) {
      console.error('Error fetching overtime data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching overtime data',
        error: error.message
      });
    }
  }

  static async getLeaves(req, res) {
    try {
      const { month, year, department, employee } = req.query;
      
      const leaveData = await Leave.getLeaves({
        month: month ? parseInt(month) : null,
        year: year ? parseInt(year) : null,
        department,
        employee
      });
      
      res.json({
        success: true,
        data: leaveData
      });
    } catch (error) {
      console.error('Error fetching leave data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching leave data',
        error: error.message
      });
    }
  }

  static async getHolidays(req, res) {
    try {
      const { year } = req.query;
      const targetYear = year || new Date().getFullYear();
      
      const holidays = await Attendance.getHolidays(targetYear);
      
      res.json({
        success: true,
        data: holidays,
        year: targetYear
      });
    } catch (error) {
      console.error('Error fetching holidays:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching holidays',
        error: error.message
      });
    }
  }

  static async getSummary(req, res) {
    try {
      const { month, year, department } = req.query;
      
      const currentDate = new Date();
      const targetMonth = month || (currentDate.getMonth() + 1);
      const targetYear = year || currentDate.getFullYear();
      
      const summary = await Attendance.getSummary(
        parseInt(targetMonth), 
        parseInt(targetYear), 
        department
      );
      
      res.json({
        success: true,
        data: summary,
        month: targetMonth,
        year: targetYear
      });
    } catch (error) {
      console.error('Error fetching summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching summary',
        error: error.message
      });
    }
  }

  static async clockIn(req, res) {
    try {
      const { employee_id } = req.body;
      const result = await Attendance.clockIn(employee_id);
      
      res.json({
        success: true,
        data: result,
        message: 'Clock-in successful'
      });
    } catch (error) {
      console.error('Error clocking in:', error);
      res.status(500).json({
        success: false,
        message: 'Error clocking in',
        error: error.message
      });
    }
  }

  static async clockOut(req, res) {
    try {
      const { employee_id } = req.body;
      const result = await Attendance.clockOut(employee_id);
      
      res.json({
        success: true,
        data: result,
        message: 'Clock-out successful'
      });
    } catch (error) {
      console.error('Error clocking out:', error);
      res.status(500).json({
        success: false,
        message: 'Error clocking out',
        error: error.message
      });
    }
  }

  static async applyLeave(req, res) {
    try {
      const leaveData = req.body;
      const result = await Leave.apply(leaveData);
      
      res.json({
        success: true,
        data: result,
        message: 'Leave application submitted'
      });
    } catch (error) {
      console.error('Error applying leave:', error);
      res.status(500).json({
        success: false,
        message: 'Error applying leave',
        error: error.message
      });
    }
  }

  static async exportData(req, res) {
    try {
      const { type } = req.params;
      const { month, year, department, format = 'csv' } = req.query;
      
      let data;
      let filename;
      
      switch (type) {
        case 'monthly':
          data = await Employee.getMonthlyAttendance(
            parseInt(month), 
            parseInt(year), 
            department
          );
          filename = `monthly_attendance_${year}_${month}.${format}`;
          break;
        case 'daily':
          data = await Attendance.getDailyAttendance(req.query.date, department);
          filename = `daily_attendance_${req.query.date}.${format}`;
          break;
        default:
          throw new Error('Invalid export type');
      }
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Convert to CSV (simplified)
        const csv = this.convertToCSV(data);
        res.send(csv);
      } else {
        res.json({
          success: true,
          data,
          filename
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting data',
        error: error.message
      });
    }
  }

  static convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }
}

module.exports = AttendanceController;