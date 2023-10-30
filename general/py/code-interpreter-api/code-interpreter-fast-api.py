from fastapi import FastAPI, UploadFile, File, Form
from codeinterpreterapi import CodeInterpreterSession, File as CodeFile

app = FastAPI()


async def generate_response(user_request, uploaded_file=None, show_response=False):
    async with CodeInterpreterSession() as session:
        files = []

        if uploaded_file:
            files.append(
                CodeFile.from_bytes(
                    uploaded_file.file.read(),
                    filename=uploaded_file.filename,
                    content_type=uploaded_file.content_type,
                )
            )

        response = await session.generate_response(user_request, files=files)

        if show_response:
            response.show()

        return response.content


@app.post("/request")
async def request(user_request: str, file: UploadFile = None, show_response: bool = False):
    response_content = await generate_response(user_request, file, show_response)
    return response_content

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
