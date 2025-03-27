const Profile = require('onf-core-model-ap/applicationPattern/onfModel/models/Profile');
const ProfileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');

exports.getStringValueForStringProfileNameAsync = async function (stringProfileName) {
    let stringValue;
    let profileList = await ProfileCollection.getProfileListAsync();
    for (let i = 0; i < profileList.length; i++) {
        let profileInstance = profileList[i];
        let profileName = profileInstance[onfAttributes.PROFILE.PROFILE_NAME];
        if (profileName == Profile.profileNameEnum.STRING_PROFILE) {
            let stringName = profileInstance[onfAttributes.STRING_PROFILE.PAC][onfAttributes.STRING_PROFILE.CAPABILITY][onfAttributes.STRING_PROFILE.STRING_NAME];
            if (stringName == stringProfileName) {
                stringValue = profileInstance[onfAttributes.STRING_PROFILE.PAC][onfAttributes.STRING_PROFILE.CONFIGURATION][onfAttributes.STRING_PROFILE.STRING_VALUE];
                break;
            }
        }
    }
    return stringValue;
}


exports.getIntegerProfileForIntegerName = async function (integerProfileName) {
    let integerProfile = {};
    let profileList = await ProfileCollection.getProfileListAsync();
    for (let i = 0; i < profileList.length; i++) {
        let profileInstance = profileList[i];
        let profileName = profileInstance[onfAttributes.PROFILE.PROFILE_NAME];
        if (profileName == Profile.profileNameEnum.INTEGER_PROFILE) {
            let integerName = profileInstance[onfAttributes.INTEGER_PROFILE.PAC][onfAttributes.INTEGER_PROFILE.CAPABILITY][onfAttributes.INTEGER_PROFILE.INTEGER_NAME];
            if (integerName == integerProfileName) {
                integerProfile = profileInstance;
                break;
            }
        }
    }
    return integerProfile;
}