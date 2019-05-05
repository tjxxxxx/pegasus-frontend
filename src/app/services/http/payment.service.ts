import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private baseUrl: any = environment.baseUrl;

  constructor(private http: HttpClient) { }

  getInvoice(id): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl + 'payment/invoice/' + id);
  }
  addFund(fund) {
    return this.http.post(this.baseUrl + 'payment/payInvoice', fund, { responseType: 'text' })
  //   .pipe(
  //     catchError(this.errorHandler)
  //   );
  // }
  //  errorHandler(error: HttpErrorResponse){
  //   return Observable.throw(error.message || "Server Error");
   }


  // other Pay
  postPaymentService(payment) {
    return this.http.post(this.baseUrl + 'other', payment);
  }
}
