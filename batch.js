// ==UserScript==
// @name         Chatgpt 批量发送
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  在页面上添加一个悬浮的文本框和按钮，模块化设置文本框内容和模拟鼠标点击事件
// @author       Lazy Zhu
// @match        https://chat.openai.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //==========================================
    //  UI逻辑
    //==========================================
    // 创建 UI 元素
    var floatingDiv = document.createElement('div');
    floatingDiv.style.position = 'fixed';
    floatingDiv.style.top = '5px';
    floatingDiv.style.right = '10px';
    floatingDiv.style.backgroundColor = 'white';
    floatingDiv.style.color = 'black';
    floatingDiv.style.padding = '10px';
    floatingDiv.style.borderRadius = '5px';
    floatingDiv.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
    floatingDiv.style.zIndex = '9999';

    // 创建显示其他元素的按钮
    var showButton = document.createElement('button');
    showButton.textContent = '复制剪切板';
    showButton.style.position = 'absolute';
    showButton.style.top = '1px';
    showButton.style.right = '1px';
    showButton.style.padding = '1px';
    showButton.style.border = 'none';
    showButton.style.borderRadius = '5px';
    showButton.style.backgroundColor = 'black';
    showButton.style.color = 'white';
    showButton.style.cursor = 'pointer';

    // 创建标题
    var title = document.createElement('h3'); // 使用h1作为标题标签
    title.textContent = 'Lazy Studio';
    title.style.color = 'black';
    title.style.textAlign = 'center'; // 将标题居中
    title.style.margin = '0 0 5px 0'; // 添加一些底部外边距，但不改变顶部外边距

    // 创建文本框
    var textarea = document.createElement('textarea');
    textarea.style.width = '300px';
    textarea.style.height = '500px';
    textarea.style.display = 'block';
    textarea.style.marginBottom = '5px';

    // 创建按钮
    var button = document.createElement('button');
    button.textContent = '批量发送';
    button.style.width = '100%';
    button.style.padding = '5px';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.backgroundColor = 'black';
    button.style.color = 'white';
    button.style.cursor = 'pointer';
    button.style.display = 'block';

    // 创建进度条
    var progress = document.createElement('progress');
    progress.style.width = '100%';
    progress.value = 0;
    progress.max = 100;

    // 将标题、文本框和按钮添加到floatingDiv中
    floatingDiv.appendChild(showButton); // 首先添加显示其他元素的按钮
    floatingDiv.appendChild(title); // 首先添加标题
    floatingDiv.appendChild(textarea); // 然后是文本框
    floatingDiv.appendChild(button); // 最后添加按钮
    floatingDiv.appendChild(progress); // 最后添加进度条

    // 点击“显示”按钮后显示其他元素
    showButton.onclick = function() {
        textarea.style.display = 'block';
    };


    //==========================================
    //  业务逻辑
    //==========================================
    function getTextWithLineBreaks(node) {
        let text = '';
        node.childNodes.forEach((child) => {
            const childText = child.textContent.trim(); // 先获取并清理文本
            if (child.nodeType === Node.TEXT_NODE) {
                // 如果是文本节点且文本非空，则直接添加
                console.log('['+childText+']')
                if (childText) {
                    text += childText;
                }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                if (child.tagName === 'P') {
                    // 对于<p>标签，如果其文本非空，在其文本后添加换行符
                    console.log('p['+childText+']')
                    if (childText) {
                        text += childText + '\n\n';
                    }
                } else {
                    // 递归处理其他元素节点
                    const nestedText = getTextWithLineBreaks(child);
                    if (nestedText) {
                        text += nestedText;
                    }
                }
            }
        });
        return text;
    }


    showButton.onclick = function(){
        // 选择所有匹配的元素
        const elements = document.querySelectorAll('.flex.flex-grow.flex-col.max-w-full');
        let evenTexts = '';
        // 遍历这些元素，选择偶数元素
        elements.forEach((element, index) => {
            // 因为索引从0开始，所以对索引加1后检查是否为偶数
            if ((index + 1) % 2 === 0) {
                evenTexts += getTextWithLineBreaks(element).replace(/\n\s*\n/g, '\n');
                evenTexts += '\n'
            }
        });

        // 将偶数元素的文本内容复制到剪贴板
        navigator.clipboard.writeText(evenTexts).then(() => {
             // 创建提示元素
            const successMessage = document.createElement('div');
            successMessage.textContent = '复制成功!';
            // 设置样式以使提示显示在页面中央
            Object.assign(successMessage.style, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                zIndex: '10000',
            });

            // 将提示添加到页面上
            document.body.appendChild(successMessage);

            // 设置定时器，在1秒后移除提示
            setTimeout(() => {
                successMessage.remove();
            }, 1000);

        }).catch(err => {
            console.error('无法复制到剪贴板', err);
        });

    }

    button.onclick = function(){
        // 获取textarea的内容
        var gtpinfo = textarea.value;
        // 按两个连续的回车符分割文本
        var commands = gtpinfo.split("\n\n");
        // 更新进度条
        progress.value = 0;
        progress.max = commands.length * 100; // 设置进度条最大值为命令数量乘以100
        // 循环打印每个部分
        processCommands(commands.slice()); // 使用 .slice() 以传递命令列表的副本
    };

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let i = 0
    async function processCommands(commands) {
        while(true){
            if (commands.length === 0) {
                console.log("所有命令已发送完毕");
                return;
            }
            i = i+1
            console.log("按钮状态："+getButtonStatus())
            if (getButtonStatus() === 'empty') {
                console.log("状态为空，可以发送下一条命令");
                let command = commands.shift(); // 获取第一个命令并从列表中移除
                sendCommand(command); // 发送命令
                i = 0
            }
            await sleep(5000); // 等待1秒
        }
    }

    async function sendCommand(command){
        console.log("sendCommand:"+command);
        // 调用方法
        setTextContent('prompt-textarea', command);
        console.log("发送命令1 "+new Date().getTime());
        await sleep(3000); // 等待3秒
        console.log("发送命令2 "+new Date().getTime());
        simulateMouseClick('button[data-testid="send-button"]');
        //await sleep(10000); // 等待10秒
        // 更新进度条
        // 更新进度条
        progress.value += 100; // 每次发送命令增加100，相当于一个命令占据进度条的100%
    }

    //获取发送按钮的状态：working，正在输出内容；empty：空闲，文本框里面空的，ready。可以点击发送按钮
    function getButtonStatus(){
        var div = document.querySelector('#prompt-textarea').parentNode;
        console.log("getButtonStatus的DIV对象"+ div )
        var sendButton = div.querySelector('button');
        console.log("sendButton:" + sendButton)
        console.log("sendButton.classNam:" + sendButton.classNam)
        console.log("sendButton.disabled:" + sendButton.disabled)

        // 输出button的所有类名
        if (button) {
            if(sendButton.className == 'rounded-full border-2 border-gray-950 p-1 dark:border-gray-200'){
                return "working"
            }else{
                if (sendButton.disabled && isTextareaEmpty("prompt-textarea")) {
                    return "empty"
                } else {
                    return "ready"
                }
            }
        } else {
            alert('在指定的div中没有找到button')
        }
    }

    floatingDiv.appendChild(textarea);
    floatingDiv.appendChild(button);
    document.body.appendChild(floatingDiv);


    function isTextareaEmpty(elementId) {
        const textarea = document.getElementById(elementId);
        if (textarea && textarea.value === '') {
            return true;
        } else {
            return false;
        }
    }

    // 方法：设置文本框内容
    function setTextContent(elementId, text) {
        var element = document.getElementById(elementId);
        if (element) {
            element.value = text;
            // 模拟键盘输入
            var event = new Event('input', {
                bubbles: true,
                cancelable: true,
            });
            element.dispatchEvent(event);
        } else {
            console.log('元素未找到: ' + elementId);
        }
    }

    // 方法：模拟鼠标点击事件
    function simulateMouseClick(selector) {
        var targetElement = document.querySelector(selector);
        if (targetElement) {
            // 创建鼠标点击事件
            var clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
            });
            // 派发事件模拟点击
            targetElement.dispatchEvent(clickEvent);
        } else {
            console.log('目标元素未找到: ' + selector);
        }
    }
})();
