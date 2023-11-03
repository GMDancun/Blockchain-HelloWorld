import { Canister, float64, query, text, update, Void } from 'azle';

// This is a global variable that is stored on the heap
let message = '';
let bmi = 0;
let simpleinterest = 0

export default Canister({
    // Query calls complete quickly because they do not go through consensus
    getMessage: query([], text, () => {
        return message;
    }),
    // Update calls take a few seconds to complete
    // This is because they persist state changes and go through consensus
    setMessage: update([text], Void, (newMessage) => {
        message = newMessage; // This change will be persisted
    }),

    //bmi = weight / height *2

    getBMI: update([float64, float64], text, (weight, height) => {
        bmi = parseFloat(weight) / (parseFloat(height) * parseFloat(height));

        if (bmi < 18){
            return "Your BMI is " + bmi + " -underweight"
        }
        else if(bmi < 25){
            return "Your BMI is " + bmi + " -normal weight"
        }
        else{
            return "Your BMI is " + bmi + " -normal weight"
        }

    }),

    // A = P(1 + rt)

    // simpleinterest = PRT / 100 or (P * R/100 * T)

    getSI: update([float64, float64, float64], text, (principal, rate, time) => {
        simpleinterest = parseFloat(principal) * parseFloat(rate)/100 * parseFloat(time);

            return "The simple interest is " + simpleinterest
    })


});

