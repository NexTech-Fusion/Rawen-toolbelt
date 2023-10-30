import argparse
import whisper

def transcribe_audio(audio_file, model_name):
    try:
        model = whisper.load_model(model_name)
        result = model.transcribe(audio_file)
        return result["text"]
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OpenAI Whisper API")

    parser.add_argument("audio_file", help="Path to the input audio file")
    parser.add_argument("--model", default="base", help="Name of the Whisper model to use (default is 'base')")

    args = parser.parse_args()

    audio_file_path = args.audio_file
    model_name = args.model

    transcribed_text = transcribe_audio(audio_file_path, model_name)

    if transcribed_text:
        print("Transcription:")
        print(transcribed_text)
    else:
        print("Transcription failed.")
