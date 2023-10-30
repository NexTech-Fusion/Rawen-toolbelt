import axios from "axios";

export async function text2speech(text: string, options?: Options): Promise<string> {
    try {
        const request = {
            method: 'POST',
            url: 'https://app.coqui.ai/api/v2/samples/multilingual/render/',
            params: { format: 'json' },
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + options?.apiKey ?? '',
            },
            data: {
                voice_id: options?.voice_id ?? 'b479aa77-3af6-45b6-9a96-506bd867c5a2',
                name: options?.name ?? 'Tester',
                text,
                speed: options?.speed ?? 1,
                language: options?.language ?? 'en'
            }
        };

        const result = await axios.request(request);
        return result.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}


interface Options {
    [key: string]: any;
    apiKey: string;
    voice_id?: string;
    name?: string;
    text?: string;
    speed?: number;
    language?: string;
}