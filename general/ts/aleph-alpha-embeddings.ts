import axios, { AxiosRequestConfig } from "axios";
import { EmbeddingsParams } from "langchain/embeddings/base";
import { Embeddings } from "openai/resources/embeddings";

interface AlephAlphaSemanticEmbeddingsParams extends EmbeddingsParams {
    model: string;
    representation: "symmetric" | "document" | "query";
    hosting?: "aleph-alpha" | null;
    compress_to_size?: number | null;
    normalize?: boolean;
    contextual_control_threshold?: number | null;
    control_log_additive?: boolean;
    baseUrl?: string;
    accessToken?: string;
}

export class AlephAlphaSemanticEmbeddings extends Embeddings {
    model: string;
    representation: "symmetric" | "document" | "query";
    hosting?: "aleph-alpha" | null;
    compress_to_size?: number | null;
    normalize?: boolean;
    contextual_control_threshold?: number | null;
    control_log_additive?: boolean;
    baseUrl: string;
    accessToken: string;

    constructor(params: AlephAlphaSemanticEmbeddingsParams | any) {
        super(params);
        this.model = params.model;
        this.representation = params.representation;
        this.hosting = params.hosting || null;
        this.compress_to_size = params.compress_to_size || null;
        this.normalize = params.normalize || false;
        this.contextual_control_threshold = params.contextual_control_threshold || null;
        this.control_log_additive = params.control_log_additive || true;
        this.baseUrl = params.baseUrl || 'https://api.aleph-alpha.com';
        this.accessToken = params.accessToken || '<YOUR_ACCESS_TOKEN>';
    }

    async embedPrompt(prompt: string): Promise<number[]> {
        try {
            const response = await this.sendSemanticEmbedRequest(prompt);
            if (response.data.embedding) {
                // Extract and return the embeddings from the response
                return response.data.embedding;
            } else {
                throw new Error("Invalid response from Aleph Alpha API");
            }
        } catch (error) {
            console.error("Error embedding prompt:", error);
            throw error;
        }
    }

    private async sendSemanticEmbedRequest(prompt: string): Promise<any> {
        const requestBody = {
            model: this.model,
            prompt: prompt,
            representation: this.representation,
            hosting: this.hosting,
            compress_to_size: this.compress_to_size,
            normalize: this.normalize,
            contextual_control_threshold: this.contextual_control_threshold,
            control_log_additive: this.control_log_additive,
        };

        const config: AxiosRequestConfig = {
            method: 'post',
            url: `${this.baseUrl}/semantic_embed`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.accessToken}`,
            },
            data: JSON.stringify(requestBody),
        };

        return axios(config);
    }
}
