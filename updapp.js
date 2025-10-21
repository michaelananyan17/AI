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
