import argparse
from codeinterpreterapi import CodeInterpreterSession, File as CodeFile


def generate_response(user_request, file_path=None, show_response=False):
    with CodeInterpreterSession() as session:
        files = []

        if file_path:
            with open(file_path, 'rb') as file:
                files.append(
                    CodeFile.from_bytes(
                        file.read(),
                        filename=file_path,
                        content_type="application/octet-stream",
                    )
                )

        response = session.generate_response(user_request, files=files)

        if show_response:
            response.show()

        return response.content


def main():
    parser = argparse.ArgumentParser(
        description="Generate AI response based on user input.")
    parser.add_argument("user_request", type=str,
                        help="User request for the AI.")
    parser.add_argument("--file", type=str,
                        help="Path to the file to be uploaded.")
    parser.add_argument("--show-response", action="store_true",
                        help="Show the AI response.")

    args = parser.parse_args()

    user_request = args.user_request
    file_path = args.file
    show_response = args.show_response

    response_content = generate_response(
        user_request, file_path, show_response)
    print(response_content)


if __name__ == "__main__":
    main()
