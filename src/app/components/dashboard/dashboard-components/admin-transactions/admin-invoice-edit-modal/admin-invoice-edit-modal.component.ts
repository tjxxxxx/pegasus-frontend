import { Component, OnInit, Input, Output } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgbActiveModal, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, Validator, Validators, RequiredValidator } from '@angular/forms';
import { TransactionService } from '../../../../../services/http/transaction.service';
import { InvoiceValidatorsService } from "src/app/services/others/invoice-validators.service"
import { LookUpsService } from "src/app/services/http/look-ups.service"
import { restoreView } from '@angular/core/src/render3';

@Component({
  selector: 'app-admin-invoice-edit-modal',
  templateUrl: './admin-invoice-edit-modal.component.html',
  styleUrls: ['./admin-invoice-edit-modal.component.css'],
})
export class AdminInvoiceEditModalComponent implements OnInit {
  public errorMsg;
  public errorAlert = false;
  public errMsgO = false;
  public errMsgM = false;
  public successAlert = false;
  public staffId = 3;
  closeResult: string;
  dueDateLocal;
  owingFeeLocal;
  itemTempPublic;
  courseData;
  coursePrice;
  concertData: Array<any>
  noteData: Array<any>
  originPrice = 0;
  userChosenPrice = 0;
  concertInUse: boolean
  noteInUse: boolean
  tempNote
  tempConcert

  // activated modal tranfer data
  @Input() item;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    public modalService: NgbModal,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private transactionService: TransactionService,
    private invoiceValidator: InvoiceValidatorsService,
    private lookUpsService: LookUpsService
  ) { }

  // invoice list fb
  invoiceEditForm = this.fb.group({
    DueDate: [null],
    CourseName: [null, Validators.required],
    LessonQuantity: [null, Validators.required],
    BeginDate: [null],
    LessonFee: [null, Validators.required],
    Concert: this.fb.group({
      ConcertFeeName: [{ value: null, disabled: true }],
      ConcertFee: [{ value: null, disabled: true }],
      concertCheckBox: [false],
    }, { validator: this.invoiceValidator.matcher }),
    Note: this.fb.group({
      NoteFeeName: [{ value: null, disabled: true }],
      NoteFee: [{ value: null, disabled: true }],
      noteCheckBox: [false]
    }, { validator: this.invoiceValidator.matcher }),
    Other1: this.fb.group({
      Other1FeeName: [null],
      Other1Fee: [null]
    }, { validator: this.invoiceValidator.matcher }),
    Other2: this.fb.group({
      Other2FeeName: [null],
      Other2Fee: [null]
    }, { validator: this.invoiceValidator.matcher }),
    Other3: this.fb.group({
      Other3FeeName: [null],
      Other3Fee: [null]
    }, { validator: this.invoiceValidator.matcher }),
    PaidFee: [null],
    OwingFee: [null]
  });

  // get quantity
  get LessonQuantity() {
    return this.invoiceEditForm.get('LessonQuantity');
  }

  ngOnInit() {
    console.log(this.invoiceEditForm);
    this.patchToInvoice();
    this.dueDateLocal = this.item.DueDate;
    this.owingFeeLocal = this.item.OwingFee;
    this.getCourse();
    this.getLooksUpData()
  }
  // get group or 121 course id
  getCourse() {
    let type;
    let courseId = this.item.CourseInstanceId
    switch (courseId) {
      case null:
        type = 1;
        break;
      default:
        type = 0;
    }
    this.transactionService.GroupOr121(courseId, type)
      .subscribe(
        res => {
          this.courseData = res
          this.coursePrice = res.Data.Course.Price
          // console.log(this.courseData)
        },
        error => {
          this.errorMsg = JSON.parse(error.error);
          console.log("Error!", this.errorMsg.ErrorMsg);
          this.errorAlert = false;
        });
  }

  // patch data to invoiceEditForm
  patchToInvoice() {
    this.invoiceEditForm.patchValue({
      CourseName: this.item.CourseName,
      LessonQuantity: this.item.LessonQuantity,
      BeginDate: this.item.BeginDate === null ? null : this.item.BeginDate.slice(0, 10),
      LessonFee: this.item.LessonFee || 0,
      Concert: {
        ConcertFee: 0,
        ConcertFeeName: ""
      },
      Note: {
        NoteFee: 0,
        NoteFeeName: ""
      },
      Other1: {
        Other1FeeName: this.item.Other1FeeName,
        Other1Fee: this.item.Other1Fee || 0,
      },
      Other2: {
        Other2FeeName: this.item.Other2FeeName,
        Other2Fee: this.item.Other2Fee || 0,
      },
      Other3: {
        Other3FeeName: this.item.Other3FeeName,
        Other3Fee: this.item.Other3Fee || 0
      },
      PaidFee: this.item.PaidFee
    });
    // this.invoiceEditForm.get("Concert.ConcertFee").disable()
  }

  // moniting user change course quantity
  changeQuantity() {
    this.invoiceEditForm.patchValue({
      LessonFee: Number(this.invoiceEditForm.value.LessonQuantity) * Number(this.coursePrice)
    });
  }

  closeSucc() {
    this.successAlert = false;
  }
  closeErro() {
    this.errorAlert = false;
  }

  // post data to server side
  sendMail(confirmModal) {
    if (this.invoiceEditForm.invalid) {
      this.errMsgM = true;
    } else {
      this.open(confirmModal);
    }
  }

  // data combination
  combiData() {
    let data = {
      BeginDate: this.invoiceEditForm.value.BeginDate,
      CourseName: this.invoiceEditForm.value.CourseName,
      DueDate: this.dueDateLocal,
      LessonFee: this.invoiceEditForm.value.LessonFee,
      LessonQuantity: this.invoiceEditForm.value.LessonQuantity,
      OwingFee: this.invoiceEditForm.value.OwingFee,
      PaidFee: this.invoiceEditForm.value.PaidFee,
      ...this.invoiceEditForm.getRawValue().Concert,
      ...this.invoiceEditForm.getRawValue().Note,
      ...this.invoiceEditForm.value.Other1,
      ...this.invoiceEditForm.value.Other2,
      ...this.invoiceEditForm.value.Other3,
      WaitingId: this.item.WaitingId,
      InvoiceNum: this.item.InvoiceNum,
      LearnerId: this.item.LearnerId,
      LearnerName: this.item.LearnerName,
      TermId: this.item.TermId,
      GroupCourseInstanceId: this.item.GroupCourseInstanceId,
      CourseInstanceId: this.item.CourseInstanceId
    }

    data.OwingFee = data.LessonFee + data.ConcertFee + data.NoteFee + data.Other1Fee + data.Other2Fee + data.Other3Fee;
    data.TotalFee = data.OwingFee;

    this.itemTempPublic = data
    console.log(this.itemTempPublic);
  }

  putInvoiceData() {
    console.log(this.itemTempPublic);
    this.transactionService.update(this.itemTempPublic)
      .subscribe(
        (res) => {
          console.log(res);
          this.activeModal.dismiss();
          alert("Save confirmed")
          // this.router.navigate(['/transaction/success']);
        },
        (error) => {
          console.log(error)
          this.errorMsg = error.error.ErrorMessage;
          console.log(this.errorMsg);
          this.errorAlert = true;
        },
    );
  }

  // confirm Modal
  open(confirmModal) {
    this.combiData();
    this.validatePrice();
    this.modalService
      .open(confirmModal)
      .result.then(
        (result) => {
          this.putInvoiceData();
        }, (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        });
  }
  // validate lesson price
  validatePrice() {
    this.originPrice = Number(this.invoiceEditForm.value.LessonQuantity) * Number(this.coursePrice);
    this.userChosenPrice = this.invoiceEditForm.value.LessonFee;
  }

  // dismiss reason of modal
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  getLooksUpData() {
    this.lookUpsService.getLookUps(15).subscribe(
      res => {
        this.concertData = res["Data"]
        this.tempConcert = {
          Concert: {
            ConcertFee: this.concertData[1].PropName,
            ConcertFeeName: this.concertData[0].PropName
          }
        }
      },
      error => {
        console.log(error)
      })

    this.lookUpsService.getLookUps(16).subscribe(
      res => {
        this.noteData = res["Data"]
        this.tempNote = {
          Note: {
            NoteFee: this.noteData[1].PropName,
            NoteFeeName: this.noteData[0].PropName
          }
        }
      },
      error => {
        console.log(error)
      }
    )
  }

  onChange(formControlName: string) {
    if (formControlName == "concertCheckBox") {
      if (this.concertInUse) {
        this.invoiceEditForm.get("Concert.ConcertFeeName").disable()
        this.invoiceEditForm.get("Concert.ConcertFee").disable()
        this.invoiceEditForm.get("Concert.ConcertFeeName").patchValue("")
        this.invoiceEditForm.get("Concert.ConcertFee").patchValue(0)
      }
      if (!this.concertInUse) {
        this.invoiceEditForm.get("Concert.ConcertFeeName").enable()
        this.invoiceEditForm.get("Concert.ConcertFee").enable()
        this.invoiceEditForm.patchValue(this.tempConcert)
      }
      this.concertInUse = !this.concertInUse
    } else if (formControlName == "noteCheckBox") {
      if (this.noteInUse) {
        this.invoiceEditForm.get("Note.NoteFeeName").disable()
        this.invoiceEditForm.get("Note.NoteFee").disable()
        this.invoiceEditForm.get("Note.NoteFeeName").patchValue("")
        this.invoiceEditForm.get("Note.NoteFee").patchValue(0)
      }
      if (!this.noteInUse) {
        this.invoiceEditForm.get("Note.NoteFeeName").enable()
        this.invoiceEditForm.get("Note.NoteFee").enable()
        this.invoiceEditForm.patchValue(this.tempNote)
      }
      this.noteInUse = !this.noteInUse
    }

  }

}
