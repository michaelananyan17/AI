javascript
// data-loader.js
class HC3DataLoader {
    constructor() {
        this.trainData = null;
        this.testData = null;
        this.valData = null;
        this.allTexts = [];
        this.allLabels = [];
    }

    // Parse JSONL file and flatten the structure
    parseJSONLFile(content) {
        const lines = content.trim().split('\n');
        const data = [];
        
        for (const line of lines) {
            try {
                const item = JSON.parse(line);
                
                // Add human answers
                if (item.answers && item.answers.human_answers) {
                    item.answers.human_answers.forEach(text => {
                        if (text && text.trim().length > 0) {
                            data.push({
                                text: text.trim(),
                                label: 0, // 0 = human
                                question: item.question
                            });
                        }
                    });
                }
                
                // Add AI answers
                if (item.answers && item.answers.chatgpt_answers) {
                    item.answers.chatgpt_answers.forEach(text => {
                        if (text && text.trim().length > 0) {
                            data.push({
                                text: text.trim(),
                                label: 1, // 1 = AI
                                question: item.question
                            });
                        }
                    });
                }
            } catch (e) {
                console.warn('Failed to parse line:', e);
            }
        }
        
        return data;
    }

    // Shuffle and split data 70/15/15
    splitData(allData) {
        // Shuffle array
        const shuffled = [...allData].sort(() => Math.random() - 0.5);
        
        const total = shuffled.length;
        const trainEnd = Math.floor(total * 0.7);
        const testEnd = trainEnd + Math.floor(total * 0.15);
        
        return {
            train: shuffled.slice(0, trainEnd),
            test: shuffled.slice(trainEnd, testEnd),
            val: shuffled.slice(testEnd)
        };
    }

    // Load training data
    async loadTrainData(file) {
        const content = await this.readFile(file);
        const allData = this.parseJSONLFile(content);
        const split = this.splitData(allData);
        
        this.trainData = split.train;
        console.log(`Training data: ${this.trainData.length} examples`);
        return this.trainData;
    }

    // Load test data
    async loadTestData(file) {
        const content = await this.readFile(file);
        const allData = this.parseJSONLFile(content);
        const split = this.splitData(allData);
        
        this.testData = split.test;
        console.log(`Test data: ${this.testData.length} examples`);
        return this.testData;
    }

    // Load validation data
    async loadValData(file) {
        const content = await this.readFile(file);
        const allData = this.parseJSONLFile(content);
        const split = this.splitData(allData);
        
        this.valData = split.val;
        console.log(`Validation data: ${this.valData.length} examples`);
        return this.valData;
    }

    // File reader utility
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // Get data counts for UI
    getDataStatus() {
        return {
            train: this.trainData ? this.trainData.length : 0,
            test: this.testData ? this.testData.length : 0,
            val: this.valData ? this.valData.length : 0
        };
    }
}
Modified UI Structure (index.html)
html
<!-- Similar to Titanic but with 3 file inputs -->
<div class="section">
    <h2>1. Data Load</h2>
    <div>
        <label>Upload Training JSONL (70%): </label>
        <input type="file" id="trainFile" accept=".jsonl">
    </div>
    <div>
        <label>Upload Test JSONL (15%): </label>
        <input type="file" id="testFile" accept=".jsonl">
    </div>
    <div>
        <label>Upload Validation JSONL (15%): </label>
        <input type="file" id="valFile" accept=".jsonl">
    </div>
    <button onclick="app.onLoadData()">Load All Data</button>
    
    <div id="dataStatus">
        <p>Training samples: <span id="trainCount">0</span></p>
        <p>Test samples: <span id="testCount">0</span></p>
        <p>Validation samples: <span id="valCount">0</span></p>
    </div>
</div>

<div class="section">
    <h2>2. AI Detection Model</h2>
    <button onclick="app.onTrain()">Train Model</button>
    <button onclick="app.onEvaluate()">Evaluate</button>
</div>

<div class="section">
    <h2>3. Test AI Detector</h2>
    <textarea id="testText" placeholder="Paste text here to check if it's AI-generated..." rows="6" cols="50"></textarea>
    <br>
    <button onclick="app.onPredict()">Check Text</button>
    <div id="predictionResult"></div>
</div>
