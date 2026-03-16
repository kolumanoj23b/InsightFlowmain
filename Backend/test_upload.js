const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testUpload() {
    const form = new FormData();
    form.append('file', fs.createReadStream('test.pdf'), 'test.pdf');
    form.append('projectId', 'default-rag-project');

    try {
        const response = await axios.post('http://localhost:6001/api/rag/upload', form, {
            headers: {
                ...form.getHeaders(),
                // mock auth middleware with our actual dev_secret_key_123 or dummy
            }
        });

        console.log('Upload successful:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Upload failed:', error.response.status, error.response.data);
        } else {
            console.error('Upload failed with message:', error.message);
        }
    }
}

fs.writeFileSync('test.pdf', 'dummy pdf content');

// mock token
const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 1 }, 'dev_secret_key_123');
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

testUpload();
