const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { ChatOpenAI } = require("@langchain/openai");
const { DirectoryLoader } = require("langchain/document_loaders/fs/directory");
const { ChatPromptTemplate, MessagesPlaceholder } = require("@langchain/core/prompts");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { createHistoryAwareRetriever } = require("langchain/chains/history_aware_retriever");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const path = require("path");
const key_map  = require( "./config");




//openai
const chat_llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.9,
    apiKey: key_map.get("openai_api_key")
});

const open_embed = new OpenAIEmbeddings({apiKey: key_map.get("openai_api_key")});

const loader = new DirectoryLoader(
  path.join(__dirname, "../documents"),
  {
      ".pdf": (filePath) => new PDFLoader(filePath),
  }
);



async function processDocuments(query) {
    try {
        const docs = await loader.load();

        const vectorStore = await FaissStore.fromDocuments(
            docs,
            open_embed
            
        );

        const retriever = vectorStore.asRetriever();


        //saving Faiss store as local
        const directory = path.join(__dirname, "../vector_store");

        await vectorStore.save(directory);
        
        // Load the vector store from the same directory
        const loadedVectorStore = await FaissStore.load(
          directory,
          open_embed
        );

      const saved_retriever = loadedVectorStore.asRetriever();

    //     const relevantDocs = await retriever.getRelevantDocuments(
    //        query
    //    );
    //         console.log(relevantDocs);
        



        // Contextualize question
        const contextualizeQSystemPrompt = `
        Given a chat history and the latest user question
        which might reference context in the chat history,
        formulate a standalone question which can be understood
        without the chat history. Do NOT answer the question, just
        reformulate it if needed and otherwise return it as is.`;


        const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
          ["system", contextualizeQSystemPrompt],
          new MessagesPlaceholder("chat_history"),
          ["human", "{input}"],
        ]);

        const historyAwareRetriever = await createHistoryAwareRetriever({
          llm: chat_llm, //llm insert
          retriever:saved_retriever,
          rephrasePrompt: contextualizeQPrompt,
        });

        // Answer question
        const qaSystemPrompt = `
        You are an assistant for question-answering tasks. Use
        the following pieces of retrieved context to answer the
        question. If you don't know the answer, just say that you
        don't know. Use three sentences maximum and keep the answer
        concise.
        \n\n
        {context}`;
        const qaPrompt = ChatPromptTemplate.fromMessages([
          ["system", qaSystemPrompt],
          new MessagesPlaceholder("chat_history"),
          ["human", "{input}"],
        ]);

        const questionAnswerChain = await createStuffDocumentsChain({
          llm: chat_llm, //llm insert
          prompt: qaPrompt,
        });

        const ragChain = await createRetrievalChain({
          retriever: historyAwareRetriever,
          combineDocsChain: questionAnswerChain,
        });


        const chat_history = [];
        const response = await ragChain.invoke({
          chat_history,
          input: query,
        });
        

        return response.answer;
    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = { processDocuments };
