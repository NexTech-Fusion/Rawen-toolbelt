## Code interpreter API 

The code interpreter API uses the 
https://github.com/shroominic/codeinterpreter-api
to interpret the code and return the result. 

### Setup

```bash
Edit in .py file your openai key

or

export OPENAI_API_KEY=your_openai_api_key

For Azure OpenAI, set the following environment variables:
export OPENAI_API_TYPE=azure
export OPENAI_API_VERSION=your_api_version
export OPENAI_API_BASE=your_api_base
export OPENAI_API_KEY=your_azure_openai_api_key
export DEPLOYMENT_NAME=your_deployment_name
```
### Install

```bash
pip install -r requirements.txt
```

## There are two choices to execute the code interpreter.
### 1. Using FastAPI:

### Run

```bash
python code-interpreter-fast-api.py
```

### Test
```bash
curl -X POST -F "user_request=Plot the bitcoin chart of year 2023" http://localhost:8000/request


curl -X POST -F "user_request=Plot the bitcoin chart of year 2023" -F "file=@path/to/your/file.csv" http://localhost:8000/analyze
```

### Run in Rawen command 
Easily via axios
```bash
const result = await axios.post("http://localhost:8000/request", { user_request: "Plot the bitcoin chart of year 2023" })
```

--- 

### 2. Using Script:

### Run

```bash
python code-interpreter-exec.py
```

### Test
```bash
python ai_script.py "Plot the bitcoin chart of year 2023" --file "path\to\your\file.csv" --show-response
```

### Run in Rawen command
Spawning or execution via exec
```bash
const prompt = 'Plot the bitcoin chart of year 2023';
const filePath = '/path/to/your/file.csv';
const showResponse = true;

const args = ['--file', filePath, '--show-response', showResponse, prompt];
const pythonScript = 'code-interpreter-exec.py';

const result = await exec("python", pythonScript, args);
```

or you write your own execution with spawn

