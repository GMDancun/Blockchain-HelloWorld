import {
    Canister,
    query,
    update,
    text,
    bool,
    Record,
    Variant,
    Result,
    StableBTreeMap,
    nat64,
    Opt,
    Some,
    None,
    Vec,
} from 'azle';
import { v4 as uuidv4 } from 'uuid';

// Farmer, Tractor, TractorHire, Error -> Models
const Farmersdetails = Record({
    id: text,
    name: text,
    contactNumber: text,
    address: text,
});

const Tractor = Record({
    id: text,
    brand: text,
    available: bool,
});

const TractorHire = Record({
    id: text,
    farmerId: text,
    tractorId: text,
    startTime: nat64,
    endTime: Opt(nat64),
    canceled: bool,
});

const Error = Variant({
    NotFound: text,
    InvalidPayload: text,
    TractorNotAvailable: text,
    TractorAlreadyBorrowed: text,
    TractorHireNotFound: text,
});

// Data Storage
const FarmerStorage = StableBTreeMap(text, Farmersdetails, 0);
const TractorStorage = StableBTreeMap(text, Tractor, 0);
const TractorHireStorage = StableBTreeMap(text, TractorHire, 0);

export default Canister({
    // Register Farmer
    registerFarmer: update([text, text, text], Result(text, Error), (name, contactNumber, address) => {
        const farmerId = uuidv4();
        const farmer: Farmersdetails = { id: farmerId, name: name, contactNumber: contactNumber, address: address };
        FarmerStorage.insert(farmerId, farmer);
        return Result.Ok(farmerId);
    }),

    // Update Farmer Details
    updateFarmer: update([text, text, text, text], Result(bool, Error), (farmerId, name, contactNumber, address) => {
        const farmer = FarmerStorage.get(farmerId);
        if (farmer) {
            farmer.name = name;
            farmer.contactNumber = contactNumber;
            farmer.address = address;
            FarmerStorage.insert(farmerId, farmer);
            return Result.Ok(true);
        }
        return Result.Err(Error.NotFound);
    }),

    // Register Tractor
    registerTractor: update([text], Result(text, Error), (brand) => {
        const tractorId = uuidv4();
        const tractor: Tractor = { id: tractorId, brand: brand, available: true };
        TractorStorage.insert(tractorId, tractor);
        return Result.Ok(tractorId);
    }),

    // Lend Tractor
    lendTractor: update([text, text], Result(text, Error), (farmerId, tractorId) => {
        const tractor = TractorStorage.get(tractorId);
        const farmer = FarmerStorage.get(farmerId);
        if (tractor && tractor.available && farmer) {
            const hireId = uuidv4();
            const hire: TractorHire = {
                id: hireId,
                farmerId: farmerId,
                tractorId: tractorId,
                startTime: ic.time(),
                endTime: None,
                canceled: false,
            };
            TractorHireStorage.insert(hireId, hire);
            tractor.available = false;
            return Result.Ok(hireId);
        }
        return Result.Err(Error.TractorNotAvailable);
    }),

    // Return Tractor
    returnTractor: update([text], Result(bool, Error), (hireId) => {
        const hire = TractorHireStorage.get(hireId);
        if (hire && !hire.endTime.isSome() && !hire.canceled) {
            hire.endTime = Some(ic.time());
            const tractor = TractorStorage.get(hire.tractorId);
            if (tractor) {
                tractor.available = true;
                return Result.Ok(true);
            }
        }
        return Result.Err(Error.TractorHireNotFound);
    }),

    // Cancel Tractor Hiring
    cancelTractorHiring: update([text], Result(bool, Error), (hireId) => {
        const hire = TractorHireStorage.get(hireId);
        if (hire && !hire.endTime.isSome() && !hire.canceled) {
            hire.canceled = true;
            const tractor = TractorStorage.get(hire.tractorId);
            if (tractor) {
                tractor.available = true;
                return Result.Ok(true);
            }
        }
        return Result.Err(Error.TractorHireNotFound);
    }),

    // Query Tractor
    queryTractor: query([text], Result(Tractor, Error), (tractorId) => {
        const tractor = TractorStorage.get(tractorId);
        if (tractor) {
            return Result.Ok(tractor);
        }
        return Result.Err(Error.NotFound);
    }),

    // Update Tractor
    updateTractor: update([text, text], Result(bool, Error), (tractorId, brand) => {
        const tractor = TractorStorage.get(tractorId);
        if (tractor) {
            tractor.brand = brand;
            TractorStorage.insert(tractorId, tractor);
            return Result.Ok(true);
        }
        return Result.Err(Error.NotFound);
    }),

    // Delete Tractor
    deleteTractor: update([text], Result(bool, Error), (tractorId) => {
        const tractor = TractorStorage.get(tractorId);
        if (tractor) {
            TractorStorage.delete(tractorId);
            return Result.Ok(true);
        }
        return Result.Err(Error.NotFound);
    }),
	
	
	
	 // Query Farmer
    queryFarmer: query([text], Result(Farmerdetails, Error), (farmerId) => {
        const farmer = FarmerStorage.get(farmerId);
        if (farmer) {
            return Result.Ok(farmer);
        }
        return Result.Err(Error.NotFound);
    }),

    // List Tractor Hire History for a Farmer
    listTractorHireHistory: query([text], Vec(TractorHire), (farmerId) => {
        const tractorHireHistory: TractorHire[] = [];
        for (const entry of TractorHireStorage.entries()) {
            const hire = entry[1];
            if (hire.farmerId === farmerId) {
                tractorHireHistory.push(hire);
            }
        }
        return tractorHireHistory;
    }),

    // // Error Handling
    // handleErrors: update([Error], Void, (error) => {
    //     console.error('Error occurred:', error);
    // }),
});