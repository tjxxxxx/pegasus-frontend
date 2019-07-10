import { Component, OnInit, Input, } from '@angular/core';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminLearnerProfileComponent } from '../../../components/dashboard/dashboard-components/admin-learner/admin-learner-profile/admin-learner-profile.component';
import { LearnersService } from '../../../services/http/learners.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-learner-item',
  templateUrl: './learner-item.component.html',
  styleUrls: ['./learner-item.component.css']
})
export class LearnerItemComponent implements OnInit {

  @Input() learner;
  @Input() learnerId;
  whichLearner:any;
  constructor(
    private modalService: NgbModal,
    private learnersService:LearnersService
  ) {}
   ngOnChanges() {
    console.log(this.learnerId);
    console.log(this.learner);
    if (!this.learner){
      this.learnersService.getLearnerById(this.learnerId).subscribe(data => {
        this.whichLearner = data["Data"];
        console.log(this.whichLearner);
      }, 
        error => {
          Swal.fire({
            title: 'Server error!',
            type: 'error',
            showConfirmButton: true,
          });
        }
      )
    }
    else{
      this.whichLearner.FirstName = this.learner.FirstName;
      this.whichLearner.LastName = this.learner.LastName;
      this.whichLearner.LearnerId = this.learner.LearnerId;
    }    
  }
  ngOnInit() {

  }
  onClicked(){
    console.log(this.learner);
    this.showModal() ;
  }
  showModal() {
    const modalRef = this.modalService.open(AdminLearnerProfileComponent,{windowClass:'my-class', backdrop: 'static', keyboard: false });
    let that = this;
    modalRef.result.then(
      (res) => {
        that.ngOnInit()
      },
      (err) => {
        return
      }
    )
    modalRef.componentInstance.whichLearner = this.learner;
  }

}
