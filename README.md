  ##  ● 声明：
非原创，本项目无大佬，本人小白，没有这个实力，全靠添义父 [@fjanenw](https://github.com/Qwsudo) 的打赏，以及群友编写调整。感谢 各位大佬 的奉献。

  ##  ● 说明：
本项目为 网页保进程，和所谓的 “账号保活” 没有关系，实现的目标是无视官方杀不杀进程或删不删crontab后，后台自动扶梯，只有当服务器重启了才需通过打开进入网页，激活vps本地自动执行命令，启动进程，不需要登录SSH的任何操作。
  ##  ● 适配：
适配 [饭奇骏](https://github.com/frankiejun/serv00-play) 大佬的 serv00-play 脚本。需要源码再开发联系 [机器人](https://t.me/SerokBot_bot) 。

【重点】：饭佬脚本中需要设置 6 选项，开启cron设 y 。

【提醒】：[账号服务] 与 [本机保活] 无法共存(本人实力有限)，意味着服务端需要占用一个账号。
        
  ##  ● 懒人一键自动安装：
（不需要登陆面板），如失败可尝试下面的手动安装。配置文件感谢群友 [@guitar295](https://t.me/guitar295) 贡献调整。

      bash <(curl -Ls https://raw.githubusercontent.com/rayray678/serv00-save-me/refs/heads/main/single/install.sh)

![Image Description](https://github.com/ryty1/alist-log/blob/main/github_images/0.jpg?raw=true)

  ##  ● 功能（账号服务与本机保活无法共存）：

    账号服务:(只要装1台）
      1、多账号管理(与保活连通）
      2、多账号节点汇聚
      3、账号状态检测
      4、通知设置
      5、ota更新

    本机保活:(装多台填到账号服务端)
      1、进程激活，
      2、更换HY2_IP
      3、查看复制节点，
      4、查看日志及进程列表。
      5、ota更新

  ##  ● 截图预览：
  
![Image Description](https://raw.githubusercontent.com/ryty1/alist-log/refs/heads/main/github_images/6.png?raw=true) 

![Image Description](https://raw.githubusercontent.com/ryty1/alist-log/refs/heads/main/github_images/4.jpg?raw=true) 

  ### ● 手动安装方法：
1、[ 登录面板 ](https://panel.serv00.com) 删除自带的域名，然后新建一个项目（也可以不删除直接新创建）。
![Image Description](https://github.com/ryty1/alist-log/blob/main/github_images/1.png?raw=true)
       
2、登录SSH客户端安装依赖

    cd ~/domains/域名

    npm install dotenv basic-auth express

3、进入域名目录

    cd ~/domains/域名/public_nodejs
       
4、创建JS文件，复制本项目里的[ app.js ](https://github.com/ryty1/sver00-keeps-alive/blob/main/app.js)内容粘贴进去
        
    nano app.js

    Ctrl+S

    Ctrl+X

5、浏览器访问域名，如图（如打不开可能需要挂代理）
        例如：https://fuhuo.serv00.net/info
![Image Description](https://github.com/ryty1/alist-log/blob/main/github_images/3.png?raw=true)

  ## ● 自己可以杀掉进程再刷新网页，然后再SSH端 ps aux 查询进程
  
