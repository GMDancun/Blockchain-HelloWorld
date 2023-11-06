import { Canister, query, text, update, Void, Record, StableBTreeMap, Ok, None, Some, Err, Vec, Result, nat64, ic, Opt, Variant } from 'azle';
import { v4 as uuidv4 } from 'uuid';
// This is a global variable that is stored on the heap

// MessagePayload, Message, Err -> Models

const MessagePayload = Record({
    title: text,
    body: text,
    attchmentUrl: text
});


// Message
const Message = Record({
    id: text,
    title: text,
    body: text,
    attchmentUrl: text,
    createdAt: nat64,
    updatedAt: Opt(nat64)

});

// Error
const Error = Variant({
    NotFound: text,
    InvalidPayload: text
});



// Message DB: StableTreeMap
// orthogonal Persistence - it maintain the state

const MessageStorage = StableBTreeMap(text, Message, 0)


export default Canister({
    // Query calls complete quickly because they do not go through consensus
    



    // create CRUD Application
    //C -> one is able to create a resource to the cannister(update), e.g Employees app



    //addMessage: update
    // function: type([datatypes for the parameters], Return Type, (parameters)){}
    addMessage:update([MessagePayload], Result(Message, Error), (payload) => {
        const message = { id: uuidv4(), createdAt: ic.time(), updatedAt: None, ...payload };
        MessageStorage.insert(message.id, message);

        return Ok(message);
    } ),
    


    // R -> Read resources excisting on the canister(query)
    // Read All Messages

    getMessages: query([], Result(Vec(Message), Error), () => {
        return Ok(MessageStorage.values());
    }),

    // Read a specific Message(id)
    getMessage: query([text], Result(Message, Error), (id) => {
        const specificMessage = MessageStorage.get(id)

        if ("None" in specificMessage){
            return Err({NotFound: `The message of id ${id} Not Found`})
        }
        
        return Ok(specificMessage.Some)
    }),



    // U -> Update the existing resources(id)
    updatedMessage: update([text, MessagePayload], Result(Message, Error), (id, payload) => {
        const updatedMessage = MessageStorage.get(id)
        if("None" in updatedMessage){
            return Err({NotFound: `The message of id {id} Not Found`});
        }

        const message = updatedMessage.Some;
        const modifiedMessage = {...message, ...payload, updatedAt: None};

        MessageStorage.insert(message.id, modifiedMessage)
        return Ok(modifiedMessage)
    }),


    //D -> Delete a resource/ 



});
// Cannister ends

   // This code below enables the uuid to work on this app
    // https://justpaste.it/bpfxm

globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
};


