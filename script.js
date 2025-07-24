class WordLearningApp {
    constructor() {
        this.currentBank = 'cet4';
        this.currentMode = 'memory'; // 'memory' 或 'recall'
        this.currentWordIndex = 0;
        this.currentLetterIndex = 0;
        this.words = [];
        this.userInput = [];
        
        this.initializeElements();
        this.bindEvents();
        
        // 延迟初始化，确保DOM完全加载
        setTimeout(() => {
            this.loadWordBank();
        }, 100);
    }

    initializeElements() {
        // 获取DOM元素
        this.wordBankSelect = document.getElementById('wordBank');
        this.modeMemoryBtn = document.getElementById('modeMemory');
        this.modeRecallBtn = document.getElementById('modeRecall');
        this.wordDisplay = document.getElementById('wordDisplay');
        this.phoneticDisplay = document.getElementById('phonetic');
        this.meaningDisplay = document.getElementById('meaning');
        this.inputArea = document.getElementById('inputArea');
        this.currentIndexSpan = document.getElementById('currentIndex');
        this.totalWordsSpan = document.getElementById('totalWords');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.keys = document.querySelectorAll('.key');
        this.successModal = document.getElementById('successModal');
        this.successWord = document.getElementById('successWord');
        
        // 初始化成功弹窗为隐藏状态
        if (this.successModal) {
            this.successModal.style.display = 'none';
            this.successModal.classList.remove('show');
        }
    }

    bindEvents() {
        // 词库选择事件
        this.wordBankSelect.addEventListener('change', (e) => {
            this.currentBank = e.target.value;
            this.loadWordBank();
            this.resetCurrentWord();
        });

        // 模式切换事件
        this.modeMemoryBtn.addEventListener('click', () => {
            this.switchMode('memory');
        });

        this.modeRecallBtn.addEventListener('click', () => {
            this.switchMode('recall');
        });

        // 控制按钮事件
        this.prevBtn.addEventListener('click', () => {
            this.previousWord();
        });

        this.nextBtn.addEventListener('click', () => {
            this.nextWord();
        });

        this.resetBtn.addEventListener('click', () => {
            this.resetCurrentWord();
            this.displayCurrentWord();
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.handleKeyInput(e);
        });

        // 虚拟键盘事件
        this.keys.forEach(key => {
            key.addEventListener('click', () => {
                const keyValue = key.dataset.key;
                this.handleVirtualKeyInput(keyValue);
            });
        });
    }

    loadWordBank() {
        // 确保wordBanks已经加载
        if (typeof wordBanks === 'undefined') {
            console.error('词库数据未加载，等待重试...');
            setTimeout(() => this.loadWordBank(), 200);
            return;
        }
        
        this.words = wordBanks[this.currentBank] || [];
        this.totalWordsSpan.textContent = this.words.length;
        this.currentWordIndex = 0;
        this.currentIndexSpan.textContent = this.currentWordIndex + 1;
        
        console.log(`加载词库: ${this.currentBank}, 单词数量: ${this.words.length}`);
        
        // 词库加载完成后显示第一个单词
        if (this.words.length > 0) {
            this.displayCurrentWord();
        } else {
            console.error('词库为空');
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // 更新按钮状态
        if (mode === 'memory') {
            this.modeMemoryBtn.classList.add('active');
            this.modeRecallBtn.classList.remove('active');
        } else {
            this.modeMemoryBtn.classList.remove('active');
            this.modeRecallBtn.classList.add('active');
        }

        this.resetCurrentWord();
        this.displayCurrentWord();
    }

    resetCurrentWord() {
        this.currentLetterIndex = 0;
        this.userInput = [];
    }

    displayCurrentWord() {
        if (this.words.length === 0) {
            console.warn('词库为空，无法显示单词');
            return;
        }

        const currentWord = this.words[this.currentWordIndex];
        
        // 显示音标和意思
        this.phoneticDisplay.textContent = currentWord.phonetic;
        this.meaningDisplay.textContent = currentWord.meaning;

        if (this.currentMode === 'memory') {
            // 记单词模式：显示完整单词
            this.wordDisplay.textContent = currentWord.word;
            this.createMemoryInput(currentWord.word);
        } else {
            // 背单词模式：隐藏单词
            this.wordDisplay.textContent = '';
            this.createRecallInput(currentWord.word);
        }

        this.updateProgress();
        this.updateControlButtons();
    }

    createMemoryInput(word) {
        // 记单词模式：显示单词，用户按顺序输入
        this.inputArea.innerHTML = '';
        
        for (let i = 0; i < word.length; i++) {
            const letterDiv = document.createElement('div');
            letterDiv.className = 'letter-input';
            
            if (i < this.currentLetterIndex) {
                // 已输入的字母
                letterDiv.textContent = word[i];
                letterDiv.classList.add(this.userInput[i] === word[i] ? 'correct' : 'incorrect');
            } else if (i === this.currentLetterIndex) {
                // 当前要输入的字母
                letterDiv.classList.add('current');
                letterDiv.textContent = this.userInput[i] || '';
            } else {
                // 未输入的字母
                letterDiv.classList.add('empty');
            }
            
            this.inputArea.appendChild(letterDiv);
        }
    }

    createRecallInput(word) {
        // 背单词模式：隐藏单词，显示下划线
        this.inputArea.innerHTML = '';
        
        for (let i = 0; i < word.length; i++) {
            const letterDiv = document.createElement('div');
            letterDiv.className = 'letter-input';
            
            if (this.userInput[i]) {
                // 已输入的字母
                letterDiv.textContent = this.userInput[i];
                letterDiv.classList.add(this.userInput[i] === word[i] ? 'correct' : 'incorrect');
            } else {
                // 未输入的字母显示下划线
                letterDiv.textContent = '_';
                letterDiv.classList.add('empty');
                if (i === this.currentLetterIndex) {
                    letterDiv.classList.add('current');
                }
            }
            
            this.inputArea.appendChild(letterDiv);
        }
    }

    handleKeyInput(e) {
        // 如果有修饰键按下（Ctrl、Alt、Meta/Cmd），不处理，让浏览器处理快捷键
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        
        const key = e.key.toLowerCase();
        
        // 只处理我们需要的按键
        if (key === 'backspace') {
            e.preventDefault(); // 阻止浏览器后退
            this.handleBackspace();
        } else if (key >= 'a' && key <= 'z') {
            e.preventDefault(); // 阻止浏览器默认行为
            this.handleLetterInput(key);
        } else if (key === 'arrowleft') {
            e.preventDefault();
            this.previousWord();
        } else if (key === 'arrowright') {
            e.preventDefault();
            this.nextWord();
        }
        // 对于其他按键，不调用preventDefault()，让浏览器正常处理
    }

    handleVirtualKeyInput(key) {
        if (key === 'backspace') {
            this.handleBackspace();
        } else {
            this.handleLetterInput(key);
        }

        // 添加按键效果
        const keyElement = document.querySelector(`[data-key="${key}"]`);
        if (keyElement) {
            keyElement.classList.add('pressed');
            setTimeout(() => {
                keyElement.classList.remove('pressed');
            }, 200);
        }
    }

    handleLetterInput(letter) {
        if (this.words.length === 0) return;

        const currentWord = this.words[this.currentWordIndex];
        
        if (this.currentMode === 'memory') {
            // 记单词模式：按顺序输入
            if (this.currentLetterIndex < currentWord.word.length) {
                this.userInput[this.currentLetterIndex] = letter;
                this.currentLetterIndex++;
                this.displayCurrentWord();
                
                // 检查是否完成
                if (this.currentLetterIndex >= currentWord.word.length) {
                    setTimeout(() => {
                        if (this.isWordCorrect()) {
                            this.showSuccess();
                        } else {
                            this.showError();
                        }
                    }, 500);
                }
            }
        } else {
            // 背单词模式：可以输入任意位置
            if (this.currentLetterIndex < currentWord.word.length) {
                this.userInput[this.currentLetterIndex] = letter;
                
                // 移动到下一个空位置
                this.currentLetterIndex++;
                while (this.currentLetterIndex < currentWord.word.length && this.userInput[this.currentLetterIndex]) {
                    this.currentLetterIndex++;
                }
                
                this.displayCurrentWord();
                
                // 检查是否完成
                if (this.userInput.filter(Boolean).length === currentWord.word.length) {
                    setTimeout(() => {
                        if (this.isWordCorrect()) {
                            this.showSuccess();
                        } else {
                            this.showError();
                        }
                    }, 500);
                }
            }
        }
    }

    handleBackspace() {
        if (this.currentLetterIndex > 0) {
            this.currentLetterIndex--;
            this.userInput[this.currentLetterIndex] = '';
            
            // 在背单词模式下，移动到上一个有内容的位置
            if (this.currentMode === 'recall') {
                while (this.currentLetterIndex > 0 && !this.userInput[this.currentLetterIndex - 1]) {
                    this.currentLetterIndex--;
                }
            }
            
            this.displayCurrentWord();
        }
    }

    isWordCorrect() {
        const currentWord = this.words[this.currentWordIndex];
        return this.userInput.join('').toLowerCase() === currentWord.word.toLowerCase();
    }

    showSuccess() {
        const currentWord = this.words[this.currentWordIndex];
        
        // 显示成功弹窗
        this.successWord.textContent = `${currentWord.word} - ${currentWord.meaning}`;
        this.successModal.style.display = 'flex';
        this.successModal.classList.add('show');
        
        // 2秒后自动关闭弹窗并跳转到下一个单词
        setTimeout(() => {
            this.successModal.classList.remove('show');
            setTimeout(() => {
                this.successModal.style.display = 'none';
                this.nextWord();
            }, 300); // 等待弹窗关闭动画完成
        }, 2000);
    }

    showError() {
        // 可以添加错误提示动画
        const inputArea = this.inputArea;
        inputArea.style.animation = 'shake 0.5s';
        setTimeout(() => {
            inputArea.style.animation = '';
        }, 500);
    }

    previousWord() {
        if (this.currentWordIndex > 0) {
            this.currentWordIndex--;
            this.resetCurrentWord();
            this.displayCurrentWord();
        }
    }

    nextWord() {
        if (this.currentWordIndex < this.words.length - 1) {
            this.currentWordIndex++;
            this.resetCurrentWord();
            this.displayCurrentWord();
        }
    }

    updateProgress() {
        this.currentIndexSpan.textContent = this.currentWordIndex + 1;
    }

    updateControlButtons() {
        this.prevBtn.disabled = this.currentWordIndex === 0;
        this.nextBtn.disabled = this.currentWordIndex === this.words.length - 1;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new WordLearningApp();
}); 