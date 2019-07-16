import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {OptionsInput} from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import {CalendarComponent} from 'ng-fullcalendar';
declare let $: any;
import timeGridPlugin from '@fullcalendar/timegrid';
import Swal from 'sweetalert2';
import {SessionsService} from '../../../../../../services/http/sessions.service';
import { copyStyles } from '@angular/animations/browser/src/util';
import {DatePipe} from '@angular/common';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {MondayDateInWeekByDatePipe} from '../../../../../../shared/pipes/monday-date-in-week-by-date.pipe';
import { CoursesService } from '../../../../../../services/http/courses.service';

@Component({
  selector: 'app-sessions-calendar-view-tutor',
  templateUrl: './sessions-calendar-view-tutor.component.html',
  styleUrls: ['./sessions-calendar-view-tutor.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SessionsCalendarViewTutorComponent implements OnInit {
  options: OptionsInput;
  isloading = false;
  @ViewChild('fullcalendar') fullcalendar: CalendarComponent;
  @ViewChild('content') content;
  @ViewChild('teacher') teacher;
  dateOfLesson;
  teachers;
  teacherId;
  teacherSelected;
  eventsModel: any;
  constructor(private sessionsService: SessionsService,
              private coursesService: CoursesService, private datePipe: DatePipe, private modalService: NgbModal,
              private mondayDatePipe: MondayDateInWeekByDatePipe) { }
  ngOnInit() {
    this.dateOfLesson = {year:new Date().getFullYear(),month:new Date().getMonth()+1,day:new Date().getDate()};
    this.getTeachers();
    this.options = {
      editable: true,
      height: 700,
      displayEventTime: false,
      maxTime: '22:00',
      minTime: '08:00',
      scrollTime: '08:00',
      header: {
        left: 'prev,next today DayPickerButton',
        center: 'title',
        right: 'timeGridWeek'
      },
      slotDuration: '00:15',
      customButtons: {
        DayPickerButton: {
          text: 'Search',
          click: () => {
            this.modalService.open(this.content);
          }
        }
      },
      eventClick: (info) => {
        console.log(info)
        Swal.fire({
            type: 'info',
            html: info.event.extendedProps.description
          }
        );
      },
      plugins: [timeGridPlugin]
    };
    this.InitialiseEventData();
  }
  getTeachers = () => {
    this.coursesService.getTeachers().subscribe(res => {
      this.teachers = res.Data;
    });
  }
  generateEventData = (data) => {
    data.forEach(s => {
      if (s.IsCanceled == 1) {
        s.color = 'grey';
      }

      if (s.IsConfirm == 1) {
        s.color = 'green';
      }
      s.title = s.orgAbbr + ' ( ' + s.title + ' )\n';
      s.title += s.student.length === 1 ? s.student[0] : null;
      s.description += '<h4>Students Name</h4><div class="row">';
      if (s.student.length === 1) {
        s.description = '<h4>Students Name</h4>' + s.student[0];
        s.description += '</div><h4>Room Name</h4>';
        if (s.IsChanged == 1) {
          s.description +=  '<div><del>' + s.roomName + ' (' + s.orgName + ' )</del></div>';
          s.description += s.newLesson.RoomName + ' (' + s.newLesson.OrgName + ' )';
        } else {
          s.description += s.roomName + ' (' + s.orgName + ' )';
        }
        s.description += '<h4>Course Name</h4>' + s.courseName + '<h4>Begin Time</h4>'
        s.description += s.IsChanged == 1 ? '<div><del>' + s.BeginTime + '</del></div>' + s.newLesson.BeginTime : s.BeginTime;
        if (s.IsConfirm == 1 || s.IsCanceled == 1) {
          s.description += '<h4>Reason (Complete or Cancel)</h4>';
          s.description += s.Reason;
        }
        return data;
      }
      s.student.forEach(w => {
        s.description += '<div class="col-4">' + w + '</div> ';

      })
      s.description += '</div><h4>Room Name</h4>'
      if (s.IsChanged == 1) {
        s.description +=  '<div><del>' + s.roomName + ' (' + s.orgName + ' )</del></div>';
        s.description += s.newLesson.RoomName + ' (' + s.newLesson.OrgName + ' )';
      } else {
        s.description += s.roomName + ' (' + s.orgName + ' )';
      }
      s.description += '<h4>Course Name</h4>' + s.courseName + '<h4>Begin Time</h4>'
      s.description += s.IsChanged == 1 ? '<div><del>' + s.BeginTime + '</del></div>' + s.newLesson.BeginTime : s.BeginTime;
      if (s.IsConfirm == 1 || s.IsCanceled == 1) {
        s.description += '<h4>Reason (Complete or Cancel)</h4>';
        s.description += s.Reason;
      }
    });
    return data;
  }

  clickButton = (model) => {
    if (model.buttonType === 'next' ||  model.buttonType === 'prev') {
      const datefromcalendar = model.data;
      const date = this.datePipe.transform(datefromcalendar, 'yyyy-MM-dd');
      this.GetEventData(date);
    }
    if (model.buttonType === 'today') {
      const datefromcalendar = model.data;
      const beginDate = this.mondayDatePipe.transform(datefromcalendar);
      this.GetEventData(this.datePipe.transform(beginDate, 'yyyy-MM-dd'));
    }
  }
  GetEventData = (beginDate) => {
    if (!this.teacherId) return
    this.isloading = true;
    this.sessionsService.getTeacherLesson(this.teacherId, beginDate).subscribe(data => {
      this.eventsModel = this.generateEventData(data.Data);
      this.isloading = false;
    }, err => {
      console.log(err);
      this.isloading = false;
    });
  }

  InitialiseEventData = () => {
    const todayDate = new Date();
    const beginDate = this.mondayDatePipe.transform(todayDate);
    this.GetEventData(this.datePipe.transform(beginDate, 'yyyy-MM-dd'));
  }

  search = () => {
    if (this.dateOfLesson === '' || this.dateOfLesson === null || this.dateOfLesson === undefined) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'please enter the date before submitting'
      });
      return;
    }
    const year = this.dateOfLesson.year;
    const month = this.dateOfLesson.month;
    const day = this.dateOfLesson.day;
    const date = year + '-' + month + '-' + day;
    const datetoshow = new Date(this.datePipe.transform(date, 'yyyy-MM-dd'));
    const beginDate = this.mondayDatePipe.transform(datetoshow);
    this.fullcalendar.calendar.gotoDate(beginDate);
    this.GetEventData(this.datePipe.transform(beginDate, 'yyyy-MM-dd'));
  }
}
