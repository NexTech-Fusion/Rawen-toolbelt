import argparse
import whisperx

def transcribe_audio(audio_file, batch_size, compute_type, model):
    device = "cpu"
    model = whisperx.load_model(model, device, compute_type=compute_type)

    audio = whisperx.load_audio(audio_file)
    result = model.transcribe(audio, batch_size=batch_size)
    return result["segments"]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OpenAI Whisper API")

    parser.add_argument(
        "audio_file",
        required=True,
        help="Path to the audio file you want to transcribe.",
    )
    parser.add_argument(
        "--batch_size",
        type=int,
        default=16,
        help="Batch size for transcription (reduce if low on GPU memory).",
    )
    parser.add_argument(
        "--compute_type",
        choices=["float16", "int8"],
        default="float16",
        help="Compute type for transcription (change to 'int8' if low on GPU memory, may reduce accuracy).",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="large-v2",
        help="Model to use for transcription (default is 'large-v2').",
    )

    args = parser.parse_args()

    segments = transcribe_audio(args.audio_file, args.batch_size, args.compute_type, args.model)
    print(segments)
