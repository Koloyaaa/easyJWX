(function () {
  // 等待 DOM 及异步加载的试题内容完全出现
  function waitForInputs(callback) {
    const check = () => {
      const inputs = document.querySelectorAll('span.tk input');
      if (inputs.length > 0) {
        callback();
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  }

  function addButton() {
    if (document.getElementById('auto-answer-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'auto-answer-btn';
    btn.textContent = '自动填答案';
    btn.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 99999;
      padding: 12px 24px;
      background: #1e88e5;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    `;
    btn.onclick = fillAnswers;
    document.body.appendChild(btn);
  }

  // 解析答案文本：支持 1) xxx、1. xxx、1、xxx 等开头格式
  function parseAnswers(text) {
    const lines = text.split(/\r?\n/);
    const answerMap = {};
    lines.forEach(line => {
      const match = line.match(/^\s*(\d+)\s*[.)、)]\s*(.*)/);
      if (match) {
        const idx = parseInt(match[1], 10);
        const ans = match[2].trim();
        if (ans) answerMap[idx] = ans;
      }
    });
    // 按序号从小到大排序，返回纯答案数组
    const sortedIdx = Object.keys(answerMap).map(Number).sort((a, b) => a - b);
    return sortedIdx.map(i => answerMap[i]);
  }

  function fillAnswers() {
    const inputs = document.querySelectorAll('span.tk input');
    if (!inputs.length) {
      alert('未找到填空输入框，请确认试卷已完全加载。');
      return;
    }

    const doFill = (answerStr) => {
      if (!answerStr) {
        alert('没有读取到答案文本，操作取消。');
        return;
      }

      const answers = parseAnswers(answerStr);
      if (!answers.length) {
        alert('未能识别出有效答案，请检查格式（如 1) 答案内容）。');
        return;
      }

      if (answers.length !== inputs.length) {
        const go = confirm(
          `识别到 ${answers.length} 条答案，但页面共有 ${inputs.length} 个填空，数量不一致，是否继续？`
        );
        if (!go) return;
      }

      inputs.forEach((inp, i) => {
        if (i < answers.length) {
          inp.value = answers[i];
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      alert(`填写完成！已成功填入 ${Math.min(answers.length, inputs.length)} 个答案。`);
    };

    // 优先尝试读取剪贴板（需要 clipboardRead 权限）
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText()
        .then(clipText => {
          if (clipText) {
            doFill(clipText);
          } else {
            const manual = prompt('剪贴板为空，请手动粘贴答案文本：');
            doFill(manual);
          }
        })
        .catch(() => {
          const manual = prompt('无法读取剪贴板，请手动粘贴答案文本：');
          doFill(manual);
        });
    } else {
      const manual = prompt('请粘贴答案文本：');
      doFill(manual);
    }
  }

  // 页面可能动态加载试题，等待填空出现后再添加按钮
  waitForInputs(addButton);
})();