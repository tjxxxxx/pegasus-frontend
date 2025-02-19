import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {OptionsInput} from '@fullcalendar/core';
import timeslot from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {CalendarComponent} from 'ng-fullcalendar';
declare let $: any;
import {DatePipe} from '@angular/common';
import {NgbModal, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'node_modules/sweetalert2/dist/sweetalert2.all.min.js';
import {FormBuilder, FormGroup} from '@angular/forms';
import { SessionsService } from 'src/app/services/http/sessions.service';
import {SessionDetailEditModalComponent} from '../../session-modals/session-detail-edit-modal/session-detail-edit-modal.component';
import {SessionEdit} from '../../../../../../models/SessionEdit';
import {SessionCancelModalComponent} from '../../session-modals/session-cancel-modal/session-cancel-modal.component';
import {SessionCompletedModalComponent} from '../../session-modals/session-completed-modal/session-completed-modal.component';
import {SessionRescheduleModalComponent} from '../../session-modals/session-reschedule-modal/session-reschedule-modal.component';
import {AdminLearnerProfileComponent} from '../../../admin-learner/admin-learner-profile/admin-learner-profile.component';
import {LearnersService} from '../../../../../../services/http/learners.service';
import {debounce} from '../../../../../../shared/utils/debounce';

@Component({
  selector: 'app-sessions-calendar-view-admin',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './sessions-calendar-view-admin.component.html',
  styleUrls: ['./sessions-calendar-view-admin.component.css']
})
export class SessionsCalendarViewAdminComponent implements OnInit {
  debounce = debounce();
  searchForm: FormGroup; // searchform by formbuilder
  reason: string;  // session edit reason
  isloadingSmall = false;  // when drag the event, it will pop up the window for confirm (this loading icon is for this modal)
  @ViewChild('content') content; // date-pick modal
  @ViewChild('confirmModal') confirmModal;
  @ViewChild('methodModal') methodModal;
  eventInfo;
  options: OptionsInput;
  eventsModel: any;
  id: any;
  isloading = false;
  private resourceData: any;
  private eventData = [];
  sessionEditModel;
  IsConfirmEditSuccess = false;
  learnerProfileLoading = false;
  @ViewChild(CalendarComponent) fullcalendar: CalendarComponent;
  t = null;
  constructor(
    protected sessionService: SessionsService,
    private datePipe: DatePipe, private modalService: NgbModal,
    private fb: FormBuilder,
    private learnersService: LearnersService,
    ) {}
  ngOnInit(): void {
    this.searchForm = this.fb.group({
      dateOfLesson: ['']
    })
    this.sessionService.getReceptionistRoom().subscribe(data => {
      this.resourceData = data.Data;
      const date = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
      this.sessionService.getReceptionistLesson(date).subscribe(event => {
        this.eventsModel = this.generateEventData(event.Data);
        this.teacherAvoidDuplicate();
      });
      this.isloading = false;
      this.options = {
        themeSystem: 'jquery-ui',
        editable: true,
        eventDurationEditable: false,
        displayEventTime: true,
        customButtons: {
          DayPickerButton: {
            text: 'Search',
            click: () => {
              this.modalService.open(this.content);
            }
          }
        },
        ////////
        eventClick: (info) => {
          this.eventInfo = info;
          const modalRef = this.modalService.open(this.methodModal);
          const Date = this.datePipe.transform(this.fullcalendar.calendar.getDate(), 'yyyy-MM-dd');
        },
        ////////
        eventDrop: (info) => { // when event drag , need to send put request to change the time of this event
          this.IsConfirmEditSuccess = false;
          this.reason = '';
          const Date = this.datePipe.transform(this.fullcalendar.calendar.getDate(), 'yyyy-MM-dd');
          const newStartTime = this.datePipe.transform(info.event.start, 'yyyy-MM-dd HH:mm');
          const newEndTime = this.datePipe.transform(info.event.end, 'yyyy-MM-dd HH:mm');
          const RoomId = info['newResource'] == null ? info.event.extendedProps.info.RoomId : parseInt(info['newResource'].id);
          this.sessionEditModel = new SessionEdit(info.event.extendedProps.info.LessonId,
            info.event.extendedProps.info.LearnerId, RoomId, info.event.extendedProps.info.TeacherId,
          info.event.extendedProps.info.OrgId, null, newStartTime);
          const modalRef = this.modalService.open(this.confirmModal);
          modalRef.result.then(() => {
            this.getEventByDate(Date);
          }, () => {
            this.getEventByDate(Date);
          });
        },
        resources: this.resourceData,
        events: this.eventData,
        allDaySlot: false,
        defaultView: 'resourceTimeGridDay',
        schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
        minTime: '08:00',
        maxTime: '21:00',
        scrollTime: '08:00',
        height: window.innerHeight - 110,
        views: {
          resourceTimeGridDay: {
            buttonText: 'Day',
            slotDuration: '00:15'
          }
        },
        windowResize: () => {
          this.fullcalendar.calendar.setOption('height', window.innerHeight - 110);
        },
        header: {
          left: 'today prev,next DayPickerButton title',
          center: '',
          right: ''
        },
        plugins: [timeslot, interactionPlugin]
      };
    });
  }


  clickButton = (model) => {
    if (model.buttonType === 'next' || model.buttonType === 'today' || model.buttonType === 'prev' || model.buttonType === 'testButton') {
      const datefromcalendar = model.data;
      const date = this.datePipe.transform(datefromcalendar, 'yyyy-MM-dd');
      this.debounce(() => {
        this.getEventByDate(date);
      }, 500);
    }

  }
  generateEventData = (data) => {
    const resourceCol = document.querySelectorAll('.fc-resource-cell')
    let teachersNewArray = []
    resourceCol.forEach(s => {
      const resourceId = Number(s.getAttribute('data-resource-id'));
      const events = data.filter(s => s.resourceId == resourceId);
      const teachersArray = []
      events.map(info => teachersArray.push(info.teacher));
      teachersNewArray = Array.from(new Set(teachersArray));
    });

    data.forEach(s => {
      if (s.isReadyToOwn == 1) {
        s.borderColor = 'red';
      }

      if (s.IsCanceled == 1) {
        s.color = 'grey';
        s.editable = false;
      }

      if (s.IsConfirm == 1) {
        s.color = 'green';
        s.editable = false;
      }
      if (teachersNewArray.length == 0) {
        const Type = '(' + s.title + ')';
        if (s.IsGroup == false) {
          s.title = 'Learner: ' + s.learner[0].FirstName + '\n';
        }
        s.title =  Type + s.title
        return data;
      }


      const type = '(' + s.title + ')';
      s.title = '';
      s.title += 'Tutor: ' + s.teacher + ' ' + type;
      if (s.IsGroup == false) {
        s.title += '\nLearner: ' + s.learner[0].FirstName;
      }
    });
    return data;
  }
  getEventByDate = (date) => {
    const teacherRoom = document.querySelectorAll('#teacherRoom');
    teacherRoom.forEach(s => {
      s.remove();
    })
    this.isloading = true;
    this.fullcalendar.calendar.removeAllEvents();
    this.sessionService.getReceptionistLesson(date).subscribe(event => {
      this.eventData = this.generateEventData(event.Data);
      this.eventsModel = this.eventData;
      this.isloading = false;
      this.teacherAvoidDuplicate();
    });
  }

  teacherAvoidDuplicate = () => {
    // document.getElementById('teacherRoom').remove()
    const resourceCol = document.querySelectorAll('.fc-resource-cell')
    resourceCol.forEach(s => {
      const resourceId = Number(s.getAttribute('data-resource-id'));
      const events = this.eventsModel.filter(s => s.resourceId == resourceId);
      const teachersArray = []
      events.map(info => teachersArray.push(info.teacher));
      const teachersNewArray = Array.from(new Set(teachersArray))
      teachersNewArray.map(q => {
        const div = document.createElement('div');
        div.setAttribute('id', 'teacherRoom');
        const text = document.createElement('span')
        text.style.cssText = 'font-style:italic;color:blue'
        text.innerText = q;
        div.appendChild(text)
        s.appendChild(div);
      });
    });
  }

  search = () => {
    if (this.searchForm.get('dateOfLesson').value === '' || this.searchForm.get('dateOfLesson').value === null) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: 'please enter the date before submitting'
      });
      return;
    }
    const year = this.searchForm.get('dateOfLesson').value.year;
    const month = this.searchForm.get('dateOfLesson').value.month;
    const day = this.searchForm.get('dateOfLesson').value.day;
    const date = year + '-' + month + '-' + day
    const datetoshow = this.datePipe.transform(date, 'yyyy-MM-dd');
    this.fullcalendar.calendar.gotoDate(datetoshow);
    this.getEventByDate(date);
  }

  ConfirmEdit = () => {
    this.isloadingSmall = true;
    this.sessionEditModel.reason = this.reason;
    this.sessionService.SessionEdit(this.sessionEditModel).subscribe(res => {
      this.IsConfirmEditSuccess = true;
      this.isloadingSmall = false;
    }, err => {
      this.isloadingSmall = false;
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: err.error.ErrorMessage
      });
    });
  }

  openEdit = (info) => {
    console.log(info);
    const Date = this.datePipe.transform(this.fullcalendar.calendar.getDate(), 'yyyy-MM-dd');
    const modalRef = this.modalService.open(SessionDetailEditModalComponent, { size: 'lg' });
    (modalRef.componentInstance as SessionDetailEditModalComponent).LessonModel = info.event.extendedProps.info;
    modalRef.result.then(
      () => {
        this.getEventByDate(Date);
      },
      () => {
        this.getEventByDate(Date);
      });
  }

  openReschedule = (info) => {
    const Date = this.datePipe.transform(this.fullcalendar.calendar.getDate(), 'yyyy-MM-dd');
    const modalRef = this.modalService.open(SessionRescheduleModalComponent);
    (modalRef.componentInstance as SessionRescheduleModalComponent).lessonid = info.event.id;
    modalRef.result.then(
      () => {
        this.getEventByDate(Date);
      },
      () => {
        this.getEventByDate(Date);
      });
  }

  openDelete = (info) => {
    const Date = this.datePipe.transform(this.fullcalendar.calendar.getDate(), 'yyyy-MM-dd');
    const modalRef = this.modalService.open(SessionCancelModalComponent);
    (modalRef.componentInstance as SessionCancelModalComponent).lessionId = info.event.id;
    modalRef.result.then(
      (result) => {
        this.getEventByDate(Date);
      },
      () => {
        this.getEventByDate(Date);
      });
  }

  openConfirm = (info) => {
    const Date = this.datePipe.transform(this.fullcalendar.calendar.getDate(), 'yyyy-MM-dd');
    const modalRef = this.modalService.open(SessionCompletedModalComponent);
    (modalRef.componentInstance as SessionCompletedModalComponent).lessonId = info.event.id;
    modalRef.result.then(
      () => {
        this.getEventByDate(Date);
      },
      () => {
        this.getEventByDate(Date);
      });
  }

  openLearnerItem = (learnerId) => {
    const Date = this.datePipe.transform(this.fullcalendar.calendar.getDate(), 'yyyy-MM-dd');
    this.learnerProfileLoading = true
    this.learnersService.getLearnerById(learnerId).subscribe(res => {
      this.learnerProfileLoading = false
      this.modalService.dismissAll()
      const modalRef = this.modalService.open(AdminLearnerProfileComponent,
        // @ts-ignore
        {size: 'xl', backdrop: 'static', keyboard: false });
      // @ts-ignore
      (modalRef.componentInstance as AdminLearnerProfileComponent).whichLearner = res.Data;
      modalRef.result.then(
        () => {
          this.getEventByDate(Date);
        },
        () => {
          this.getEventByDate(Date);
        });
    }, err => {
      this.learnerProfileLoading = false
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: err.error.ErrorMessage
      });
    });
  }

}
