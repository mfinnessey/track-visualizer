require('dotenv').config();


module.exports = {

    stateKey: 'spotify_auth_state',

    // app configuration information
    client_id: 'efb4e6813d584347a2167efa37ff680a',
    client_secret: process.env.CLIENT_SECRET,
    redirect_uri: 'http://raspberrypi.local:8888/callback',


    /**
     * Generates a random string containing numbers and letters
     * @param  {number} length The length of the string
     * @return {string} The generated string
     */
    generateRandomString: function(length) {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }



};
