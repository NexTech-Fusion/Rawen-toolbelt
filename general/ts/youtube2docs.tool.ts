import { ensurePackagesInstalled } from "./ensure-installed";
const libYoutube = "youtube-transcript";
const libYoutubeJs = "youtubei.js";

export async function transcribe(url: string, language = "en") {
    await ensurePackagesInstalled([libYoutube, libYoutubeJs]);
    const { YoutubeLoader } = await import("langchain/document_loaders/web/youtube");

    const loader = YoutubeLoader.createFromUrl(url, {
        language,
        addVideoInfo: true,
    });

    const docs = await loader.load();

    return docs;
}

