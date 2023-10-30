import argparse
from transformers import AutoProcessor, BarkModel
import scipy
import base64

def generate_audio(text, voice_preset, file_path="bark_out.wav"):
    processor = AutoProcessor.from_pretrained("suno/bark-small")
    model = BarkModel.from_pretrained("suno/bark-small")

    inputs = processor(text, voice_preset=voice_preset)

    audio_array = model.generate(**inputs)
    audio_array = audio_array.cpu().numpy().squeeze()
    
    sample_rate = model.generation_config.sample_rate
    scipy.io.wavfile.write(file_path, rate=sample_rate, data=audio_array)

    return file_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bark API")
    parser.add_argument("text", help="Input text to generate audio")
    parser.add_argument("--voice", default="v2/en_speaker_6",
                        help="Voice (default: v2/en_speaker_6)")
    parser.add_argument("--output", default="bark_out.wav", help="Output audio file path")


    args = parser.parse_args()

    text_input = args.text
    voice = args.voice
    output = args.output

    audio_data = generate_audio(text_input, voice, output)

    print(audio_data)
