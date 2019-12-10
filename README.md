# LLDB-Debug
通过USB直连手机，并可通过lldb进行调试，断点，查看修改寄存器信息的一站式配置。
### 安装配置文件
1. 将lldb解释器改为python3，并增加lldbinit文件
```
defaults write com.apple.dt.lldb DefaultPythonVersion 3
touch ~/.lldbinit
```
2. 安装issh，具体参考[github项目](https://github.com/4ch12dy/issh)
```
git clone https://github.com/4ch12dy/issh.git
cd issh
./install.sh
```
3. 安装lldb-python-script,并加入lldb启动配置中
```
git clone https://github.com/dearlancer/lldb-python-script.git
cd lldb-python-script
./install.sh
echo 'command script import /Users/xxx/github/lldb-python-script/xlldb.py' >> ~/.lldbinit
echo 'command alias freshxlldb command script import /Users/xxx/github/lldb-python-script/xlldb.py' >> ~/.lldbinit
```
4. 配置sbr，[脚本链接](https://github.com/dearlancer/LLDB-Debug/python/sbr.py)
```
mkdir ~/.lldb
cp ./python/sbr.py ~/.lldb
echo 'command script import /Users/xxx/.lldb/sbr.py' >> ~/.lldbinit
```
5. 安装[voltron](https://github.com/dearlancer/voltron.git)，加入lldb启动配置中
```
git clone https://github.com/dearlancer/voltron.git
cd voltron && ./install.sh
echo 'command script import /Users/xxx/Library/Python/3.7/lib/python/site-packages/voltron/entry.py' >> ~/.lldbinit
```
Enjoy it now～
