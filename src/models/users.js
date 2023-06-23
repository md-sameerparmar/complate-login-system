const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: [true, 'This email is alredy registerd']
    },
    password: {
        type: String,
        required: true,
    },
    tokens: [{
        token:{
            type: String,
            required: true,
        }
    }],
})

userSchema.methods.generateAuthToken = async function() {
    try {
        const token = await jwt.sign({_id: this._id.toString()}, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token});
        await this.save();
        return token;
    } catch (error) {
        // res.send(error);
        console.log(error);
    }
}

const User = new mongoose.model("User", userSchema);

module.exports = User;