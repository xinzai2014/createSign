(function(){
    var pk = `MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDezVxKcy9EpWMxuvdxOXJq5mR
1yP2tUVa3e/WNW3RSXVN2i2m9Uvp2Om1RGMx34suvPOR6XkX1HjbC5B/u/rqPrQl
7bw72TpIr7sWSaJiB7oCKnP+qK/aiOYXHK7ICiNV1EA9m2Yqjd0QqWLxJje3Gclv
cY4CeWdRuNYetRZuUwIDAQAB`;
var EncodeJs = new JSEncrypt(pk);
EncodeJs.setPublicKey(pk);
var signType = 0;   //0 单机版  1服务器版
// EncodeJs.setPublicKey(signPk);
$('#confirm').on('click',()=>{
    signType  = 0;
    let insertNum = Number($('#insert-num').val());
    if(!insertNum)return;
    let content = '';
    for(let i=0;i<insertNum;i++){
        content+=`
        <li>
            ${i+1}. dogId：<input type="text" placeholder="填写dogId" />
            有效期:<input class="number" type="text" placeholder="填写使用时间" />个月
        </li>`
    }
    $('.dog-list ol').html(content);
    $('#auto-recognize').show();
});

$('#confirmSys').on('click',()=>{
    signType  = 1;
    let insertNum = Number($('#insert-num').val());
    if(!insertNum)return;
    let content = '';
    for(let i=0;i<insertNum;i++){
        content+=`
        <li>
            ${i+1}. 用户名：<input type="text" id="user-name" placeholder="用户名" />
            密码:<input type="text" id="user-password" placeholder="密码" />
            服务器设备ID:<input type="text" id="device-id" placeholder="设备ID" />
            有效期:<input class="number" type="text" id="end-date" placeholder="填写使用时间" />个月
        </li>`
    }
    $('.dog-list ol').html(content);
    $('#auto-recognize').show();
});


function init(){

    location.reload();
    
}
$('#reset').on('click',()=>{
    init();
})
let autoLock = false;
$('#auto-recognize').on('click',()=>{   //自动识别按钮
    if(autoLock){
        alert('5秒后重复执行');
        return;
    }
    autoLock = true;
    setTimeout(()=>{
        autoLock = false;
    },5000);
    recognize(0);
    
})
// $('#re-recognize').on('click',()=>{
//     if(autoLock){
//         alert('5秒后重复执行');
//         return;
//     }
//     autoLock = true;
//     setTimeout(()=>{
//         autoLock = false;
//     },5000);
//     recognize(1);
// })
function recognize(batch){   //识别
    let insertNum = Number($('#insert-num').val());
    let aInput = $('.dog-list ol input');
    let aNumber = $('.dog-list ol .number');
    let aLi =  $('.dog-list ol li');
    let dogInfoList = [];
    if(aInput.length===0)return;
    for(let i=0;i<aInput.length;i++){
        if(!aInput.eq(i).val()){
            return alert('有未填全项');
        }
    }
    for(let i=0;i<aNumber.length;i++){
      if(!aNumber.eq(i).val().match(/^\d*$/g)){
        return alert('有效期月份只允许为数字');
      }
    }
    for(let i=0;i<aLi.length;i++){
      let input = aLi.eq(i).find('input');
      if(signType == 0){
        dogInfoList.push({
            dogId: input.eq(0).val(),
            validity: input.eq(1).val(),

            username: $('#user-name').val(),
            password:$('#user-password').val(),
            deviceId:$('#device-id').val()
        })
      }else{
        dogInfoList.push({
            username: $('#user-name').val(),
            password:$('#user-password').val(),
            deviceId:$('#device-id').val(),
            validity:$('#end-date').val()
        })
      }
     
    }
    for(let i=0;i<dogInfoList.length;i++){
      getTem(dogInfoList[i],i,batch)
      .then(data=>{
        let insertConntent = `
        {
            "dog":[
                ${data.dogContent}
            ],
            "user":[
                ${data.userContent}
            ],
            "group":[
                ${data.groupContent}
            ],
            ${(batch==1||true)?`"validity" :{"end":"${data.validity}","deviceid":"${data.sign}"${signType!=1?`,"status":"0"`:''}}`:''}
        }
        `;
       
        insertConntent = insertConntent.replace(/\s/g,'');
        // if(signType == 0){
            $('.reset').show();
        // }else{
        //     $('.reset').hide();
        // }
        console.log(insertConntent);
        let encode = EncodeJs.encryptLong(insertConntent);
        let blob = new Blob([encode],{type:'application/txt'});
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.download = (signType==0?dogInfoList[i].dogId:dogInfoList[i].deviceId)+'.key';
        a.href=  url;
        a.click();
      },err=>{
        console.log(err);
      })
    }
}
function getTem(dogInfoList,i,batch){   //获取模版
    return new Promise((resolve,reject)=>{
        let dogContent='',userContent='',groupContent='';
        let validity = getTsFormatDate(new Date().getTime()+dogInfoList.validity*(30*24*60*60*1000));
        
        $.ajax(
            {
            url:'/getSign',
            type:'POST',
            data:{
                dogId:dogInfoList.dogId?dogInfoList.dogId:"",
                deviceId:dogInfoList.deviceId?dogInfoList.deviceId:"",
                valid:validity
            },
            success(data){
                if(data.status==0){
                    dogContent = `
                    {
                        "id":${dogInfoList.dogId?dogInfoList.dogId:"1"},
                        "ukeyId":10000${i+1},
                        "sign":"${data.sign}"
                    },`;
                    if(batch==0){
                        userContent = `
                        {
                            "id":${dogInfoList.dogId?dogInfoList.dogId:"1"},
                            ${signType==0?(`"ukeyId":10000${i+1},`):""}
                            "username":${signType==0?`"admin_${i+1}"`:`"${dogInfoList.username}"`},
                            "password":${signType==0?`"e13eacea76e4faa9b8b1831242784f44"`:`"${dogInfoList.password}"`},
                            "fullName":"admin_${i+1}",
                            "team":"admin",
                            "remark":"",
                            "date":"CURRENT_TIMESTAMP",
                            "validity":"${validity}",
                            ${signType==0?`"unitId":"0"`:""}
                        },`;

                    }else{
                        userContent = `
                        {
                            "id":${dogInfoList.dogId?dogInfoList.dogId:"1"},
                            "ukeyId":10000${i+1},
                            "username":"admin_${i+1}",
                            "password":"123123",
                            "fullName":"admin_${i+1}",
                            "team":"admin",
                            "remark":"",
                            "date":"CURRENT_TIMESTAMP",
                        },`;
                    }
                    
                    groupContent = `
                    {
                        "userId":${dogInfoList.dogId?dogInfoList.dogId:"1"},
                        "userGroupId":1
                    }`;
                    resolve({dogContent,userContent,groupContent,validity,sign:data.sign});
                }else{
                    reject(data.message);
                }
                
            },
            error(err){
                reject(err);
            }
            }
        )
    })
      
}

function getTsFormatDate(timeStamp) {
    var date = new Date(timeStamp);
    //console.log(date); 结果为：Tue Apr 02 2019 07:49:23 GMT+0800 (中国标准时间)
    var seperator1 = "-";
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = year + seperator1 + month + seperator1 + strDate;
    return currentdate;
}
JSEncrypt.prototype.encryptLong = function(string) {
    var k = this.getKey();
    var maxLength = 117;
    var lt = "";
    var ct = "";
    string = Base64.encode(string);
    if (string.length > maxLength) {
        lt = string.match(/.{1,117}/g);
        lt.forEach(function(entry) {
            var t1 = k.encrypt(entry);
            
            ct += EncodeJs.hex2b64(t1)+'-' ;
        });
        return ct.substring(0,ct.length-1);
    }
    var t = k.encrypt(string);
    var y = EncodeJs.hex2b64(t);
    return y;
};

    // 创建Base64对象
var Base64 = new Base64();
function Base64() { 
    // private property 
    var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="; 
    // public method for encoding 
    this.encode = function (input) { 
        var output = ""; 
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4; 
        var i = 0; 
        input = _utf8_encode(input); 
        while (i < input.length) { 
            chr1 = input.charCodeAt(i++); 
            chr2 = input.charCodeAt(i++); 
            chr3 = input.charCodeAt(i++); 
            enc1 = chr1 >> 2; 
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4); 
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6); 
            enc4 = chr3 & 63; 
            if (isNaN(chr2)) { 
                enc3 = enc4 = 64; 
            } else if (isNaN(chr3)) { 
                enc4 = 64; 
            } 
            output = output + 
            _keyStr.charAt(enc1) + _keyStr.charAt(enc2) + 
            _keyStr.charAt(enc3) + _keyStr.charAt(enc4); 
        } 
        return output; 
    } 
    // public method for decoding 
    this.decode = function (input) { 
    var output = ""; 
    var chr1, chr2, chr3; 
    var enc1, enc2, enc3, enc4; 
    var i = 0; 
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, ""); 
    while (i < input.length) { 
        enc1 = _keyStr.indexOf(input.charAt(i++)); 
        enc2 = _keyStr.indexOf(input.charAt(i++)); 
        enc3 = _keyStr.indexOf(input.charAt(i++)); 
        enc4 = _keyStr.indexOf(input.charAt(i++)); 
        chr1 = (enc1 << 2) | (enc2 >> 4); 
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2); 
        chr3 = ((enc3 & 3) << 6) | enc4; 
        output = output + String.fromCharCode(chr1); 
        if (enc3 != 64) { 
            output = output + String.fromCharCode(chr2); 
        } 
        if (enc4 != 64) { 
            output = output + String.fromCharCode(chr3); 
        } 
    } 
    output = _utf8_decode(output); 
    return output; 
    } 
    // private method for UTF-8 encoding 
    var _utf8_encode = function (string) { 
    string = string.replace(/\r\n/g,"\n"); 
    var utftext = ""; 
    for (var n = 0; n < string.length; n++) { 
        var c = string.charCodeAt(n); 
        if (c < 128) { 
            utftext += String.fromCharCode(c); 
        } else if((c > 127) && (c < 2048)) { 
            utftext += String.fromCharCode((c >> 6) | 192); 
            utftext += String.fromCharCode((c & 63) | 128); 
        } else { 
            utftext += String.fromCharCode((c >> 12) | 224); 
            utftext += String.fromCharCode(((c >> 6) & 63) | 128); 
            utftext += String.fromCharCode((c & 63) | 128); 
        } 
    } 
    return utftext; 
    } 
    // private method for UTF-8 decoding 
    var _utf8_decode = function (utftext) { 
        var string = ""; 
        var i = 0; 
        var c = c1 = c2 = 0; 
        while ( i < utftext.length ) { 
            c = utftext.charCodeAt(i); 
            if (c < 128) { 
                string += String.fromCharCode(c); 
                i++; 
            } else if((c > 191) && (c < 224)) { 
                c2 = utftext.charCodeAt(i+1); 
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63)); 
                i += 2; 
            } else { 
                c2 = utftext.charCodeAt(i+1); 
                c3 = utftext.charCodeAt(i+2); 
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)); 
                i += 3; 
            } 
        } 
        return string; 
    } 
}


})()
