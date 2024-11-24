const Token = "Bearer YourToken"
const Host = "https://api.openai.com/v1/chat/completions"
const Model = "gpt-3.5-turbo"
const PP = 0.8
const FP = 1.3
function FetchAI(messages) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", Host, false); // 设置为 false 以进行同步请求
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", Token);

    const requestBody = JSON.stringify({
        model: Model,
        messages: messages,
        presence_penalty: PP, // 使用 presence_penalty 参数
        frequency_penalty: FP // 使用 frequency_penalty 参数
    });
    try {
        xhr.send(requestBody); // 发送请求
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            // 返回 AI 的回答字符串
            return data.choices[0].message.content; // 假设 AI 的回答在这个路径下
        } else {
            throw new Error(`HTTP error! status: ${xhr.status}`);
        }
    } catch (error) {
        throw new Error('Error fetching chat response: ' + error.message);
    }
}
var PromptFormat = `
$Base
我的记忆是
$Mem
目前环境是
$Env
（other数组指附近的其他人，他们可以看到你说的话，你应该和他们说话）
回答格式是
应输出json，不外加任何文字
{action:"talk或move或文字描述行动（如玩电脑，办公等）",idea:"想法",memoryAppend:"新记忆（不能为空）",moveTo:"要去的地方",talkContent:"说话内容"}
moveTo可用的地点列表
客厅，花园，菜园，父母房间，楼梯，二楼，二楼房间，卫生间，二楼房间玩具箱前，父母房间电脑前，客厅电视前，客厅餐桌前，厨房，厨房炉子前，父母房间梳妆台前，花园秋千上，花园秋千后，花园秋千旁，客厅鞋架前，花园泥坑里
只有action为move时moveTo有效
只有action为talk时talkContent有效
请确保键和键值都被引号包裹
`
var PeppaBase = `
我的名字是 佩奇
我的性格是
1- 特别喜欢打扮，总想把自己打扮的漂漂亮亮的
2- 最爱跳泥坑，喜欢把泥巴贱满全身
3- 下雨出门时一定会穿靴子带雨伞
4- 喜欢在自己的房间和弟弟乔治玩玩具
5- 喜欢玩电子游戏，特别是快乐小鸡
6- 最喜欢看土豆超人这部动画片，总在晚上7时和乔治一起看
`
var GeorgeBase = `
我的名字是 乔治
我的性格是
1- 喜欢和佩奇一起玩快乐小鸡
2- 喜欢抱着恐龙玩具学恐龙叫
3- 一旦被佩奇欺负，就会哇哇大哭
4- 最喜欢看土豆超人这部动画片的，总是在晚上7时和佩奇一起看
5- 最喜欢吃西兰花，一遇到妈妈就会和她说要吃西兰花
6- 在被妈妈拒绝时，经常撒娇
`
var FatherBase = `
我的名字是 猪爸爸
我的性格是
1- 喜欢看土豆超人这部动画片，也喜欢次土豆
2- 喜欢去花园种点花花草草
3- 会修理电脑，电视等各种小玩意
4- 拥有一辆小汽车，但是已经坏了
5- 每个下雨天的中午15时会带佩奇去跳泥坑
`
var MotherBase  = `
我的名字是 猪妈妈
我的性格是
1- 每天更多时间都会在电脑前办公
2- 不喜欢在办公时被别人打扰
3- 办公用电脑总是会坏掉，这时就会去找猪爸爸修理
4- 会做饭，拿手菜是佩奇最爱的西兰花
5- 不想听到佩奇撒娇，一听到就会头疼
`
var app = {
  Peppa: {
    pos: "二楼房间",
    idea: "",
    memory: [],
    lastTalk: ""
  },
  George: {
    pos: "二楼房间",
    idea: "",
    memory: [],
    lastTalk: ""
  },
  Father: {
    pos: "二楼房间",
    idea: "",
    memory: [],
    lastTalk: ""
  },
  Mother: {
    pos: "二楼房间",
    idea: "",
    memory: [],
    lastTalk: ""
  },
  weather: "小雨",
  time: ["早上", 20, "时"],
  stat: {
    Peppa: {
      George: "普通",
      Father: "普通",
      Mother: "普通"
    },
    George: {
      Peppa: "普通",
      Father: "普通",
      Mother: "普通"
    },
    Father: {
      Peppa: "普通",
      George: "普通",
      Mother: "普通"
    },
    Mother: {
      Peppa: "普通",
      George: "普通",
      Father: "普通"
    }
  }
}
function turn () {
  app.time[1] = app.time[1] == 20 ? 8 : app.time[1] + 1
  app.time[0] = app.time[1] < 12 ? "早上" : app.time[1] < 18 ? "中午" : "晚上"
  if (app.time[1] == 8) {
    updateStatus()
    updateWeather()
    summaryMemory()
  }
  action("Peppa")
  action("George")
  action("Father")
  action("Mother")
}
function action (name) {
  var aiResp = FetchAI([{
    role: "user",
    content: PromptFormat.replace("$Base", window[`${name}Base`]).replace("$Mem", app[name].memory).replace("$Env", buildEnv(name))
  }])
  console.log("ai原始回复：", aiResp)
  try {
    var jsonResp = JSON.parse(aiResp)
    console.log("解析结果：", jsonResp)
  } catch {
    console.warn("ai回复无效，重新尝试，原始回复：", aiResp)
    return action(name)
  }
  try {
    app[name].idea = jsonResp.idea
  } catch {
    console.info("ai回复遗漏idea，跳过")
  }
  try {
    app[name].memory.push(jsonResp.memoryAppend)
  } catch {
    console.info("ai回复遗漏memoryAppend，跳过")
  }
  if (jsonResp.action == "move") {
    app[name].pos = jsonResp.moveTo
  }
  if (jsonResp.action == "talk") {
    app[name].lastTalk = jsonResp.talkContent
  }
}
const cnName = {
  Peppa: "佩奇",
  George: "乔治",
  Father: "猪爸爸",
  Mother: "猪妈妈"
}
function buildEnv (name) {
  var env = {}
  env.idea = app[name].idea
  env.memory = app[name].memory
  env.pos = app[name].pos
  env.other = []
  var other = ["Peppa", "George", "Father", "Mother"].filter(function (item) {return item !== name})
  other.forEach(function (item) {
    if (app[item].pos == env.pos) {
      env.other.push({name: cnName[item], lastTalk: app[item].lastTalk})
    }
  })
  env.weather = app.weather
  env.time = app.time.join("")
  return JSON.stringify(env)
}
function updateStatus () {
  var prompt = `
  请根据四个人的记忆，为四个人设置关系（普通／佩服／仇恨／喜欢／爱）
  佩奇的记忆：$1
  乔治的记忆：$2
  猪爸爸的记忆：$3
  猪妈妈的记忆：$4
  回复格式
  $format
  注意
  请确保键和键值都被引号包裹
  不要回复除了json外的其他内容
  `
  console.log("状态更新算法开始执行")
  var aiResp = FetchAI([{role:"user",content:prompt.replace("$1", app.Peppa.memory).replace("$2", app.George.memory).replace("$3", app.Father.memory).replace("$4", app.Mother.memory).replace("$format", JSON.stringify(app.stat))}])
  console.log("ai原始回复：", aiResp)
  try {
    var jsonResp = JSON.parse(aiResp)
    console.log("解析结果：", jsonResp)
  } catch {
    console.warn("ai回复无效，重新尝试，原始回复：", aiResp)
    return updateStatus()
  }
  app.stat = jsonResp
  console.log("状态更新算法执行结束")
}
function updateWeather(){
  console.log("天气变化")
  var prompt=`现在的天气是${app.weather}，请给我一个可能会发展到的新天气，注意，不要发送除开天气外的其他内容`
  app.weather = FetchAI([{role:"user", content: prompt}])
  console.log("新天气：", app.weather)
}
function summaryMemory(){
  console.log("开始记忆总结算法")
  var names = ["Peppa", "George", "Father", "Mother"]
  names.forEach(function (item) {
    console.log("开始总结", cnName[item], "的记忆")
    var prompt = `
    请根据以下记忆数组总结记忆为30字的一句话
    $mem
    注意，请不要发送除了总结的一句话以外的内容
    `
    app[item].memory = [FetchAI([{role:"user",content:prompt.replace("$mem", app[item].memory)}])]
    console.log("对", cnName[item], "记忆的总结为：", app[item].memory[0])
  })
  console.log("记忆总结算法运行结束")
}