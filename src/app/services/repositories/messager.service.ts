import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class MessagerService {
  public baseUrl: any = environment.baseUrl;
  public subsOfStaffs;
  public subsOfTeachers;
  public subsOfStudents;
  public errorFlag: boolean;

  constructor(private http: HttpClient) { 
    console.log('service')
  }

  //目前不同的权限调用的api不同 后台在改 到时候可以直接调用同一个api 后台进行判断 未完成
  getSubscribersList(userId) {
    //To avoid dulplicated data transfer, when the web initiate, call api from server(refresh, render or re-render don't call api)
    if(sessionStorage.chattingInit == 'true'){
      return;
    }
    else{ 
      this.http.get(this.baseUrl + 'Chat/GetChattingList/' + userId).subscribe(
        (res) => {
          let subsStr =  JSON.stringify(res['Data']);
          //store the subscirbers list in session storage
          sessionStorage.setItem('subscribers',subsStr);
          //set 'true' as a sign
          sessionStorage.setItem('chattingInit', 'true');
        },
        (err) => {
          //console.log(err)
          this.errorFlag = true;
        }
      ) 
    }
  }

  /*
    return the subscribers stored in local session storage,
      -->为了代码整洁 把从sessionStorage里面获取数据放在了service里面
  */
  getSubscribers(){
    return JSON.parse(sessionStorage.getItem('subscribers'));
  }

  /*
    save the subscriber's object now chatting in session storage 
  */
  saveSubscriberChattingWith(subscriber){
    let subscriberStr = JSON.stringify(subscriber);
    sessionStorage.setItem('subscriberChattingWith',subscriberStr);
    this.saveRecentSubscribers(subscriber);
  }

  /*
    get the subscriber's now chatting Object from session storage
  */
  getSubscriberChattingWith(){
    let subscriberObj = sessionStorage.getItem('subscriberChattingWith')? JSON.parse(sessionStorage.getItem('subscriberChattingWith')):null;
    return subscriberObj;
  }

  /*
    save the recent subscribers in session storage
  */
  saveRecentSubscribers(subscriberObj){
    let userId = subscriberObj.UserId;
    let array:string = sessionStorage.getItem('recentlySubscriberArray')
    let arrayObj = array?JSON.parse(array):[];
   
    let index = arrayObj.findIndex(item => item.UserId === userId);
    if(index !== -1){
      arrayObj.splice(index, 1);
    }
    arrayObj.push(subscriberObj);
    sessionStorage.setItem('recentlySubscriberArray',JSON.stringify(arrayObj));
  }

  /*
    get the recent subscribers from session storage
  */
  getRecentSubscribers(){
    return JSON.parse(sessionStorage.getItem('recentlySubscriberArray'));
  }

  /*
    save custom personl theme in local storage
  */
  saveCustomizedTheme(theme){
    localStorage.setItem('themeIndex', theme);
  }

  /*
    get custom personl theme in local storage
  */
  getCustomizedTheme(){
    return localStorage.getItem('themeIndex');
  }

  /*
    save chatting history
  */
  saveChattingHistory(messageObj:{subscriberId:number,message:string,leftOrRight:string,createTime:any}){
    let historyKeyName = messageObj.subscriberId + 'History';
    if(sessionStorage.getItem(historyKeyName)){
      let historyObj = JSON.parse(sessionStorage.getItem(historyKeyName));
      historyObj.push(messageObj);
      sessionStorage.setItem(historyKeyName,JSON.stringify(historyObj));
    }
    else{
      sessionStorage.setItem(historyKeyName,JSON.stringify([messageObj]));
    }
  }

  getChattingHistory(userId){
    let historyKeyName = userId + 'History';
    if(sessionStorage.getItem(historyKeyName)){
      return JSON.parse(sessionStorage.getItem(historyKeyName));
    } 
    else{
      return [];
    }
  }
}
