const router = require('koa-router')()
const path = require('path');
const exec = require('child_process').exec;
var os=require('os');
var platform = os.platform();  
router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.get('/string', async (ctx, next) => {
  ctx.body = 'koa2 string'
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})
router.post('/getSign',async(ctx,next)=>{
  try{
    let reqData = ctx.request.body;
    let signJar = path.resolve(__dirname,'..\\lib\\creat_sign.jar');
    console.log(reqData);
    var cmd ;
    // java -jar creat_sign.jar 121212 2020/09/09 --xjar.password=YulumhCF
  
    cmd = `java -jar ${signJar} ${reqData.dogId?reqData.dogId:reqData.deviceId} ${reqData.valid} --xjar.password=YulumhCF`;
    console.log(cmd);
    await new Promise((resolve,reject)=>{
      exec(cmd,{windowsHide:true}, (error, stdout, stderr) => {
        if (error) {
          console.error(`执行的错误: ${error}`);
          reject({status:-1,message:error});
        }
        console.log(`stdout: ${stdout}`);
        if(stdout){
          resolve({status:0,sign:stdout.split(' ')[2]});
        }
        if(stderr){
          reject({status:-1,message:stderr});
        }
      });
    })
    .then(data=>{
      ctx.body = data;
    },
    err=>{
      ctx.body = data;
    })
     
  }
  catch(err){
    return ctx.body={status:-1,message:err};
  }
})
module.exports = router
