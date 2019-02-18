const VPBX = require('mango-vpbx');
const vpbx = new VPBX('srvtxbv5axyvr2u2fbo2k59pq53wwm7e','f18kagpch8c3v4d8kmrvxirgfu6nf0sl');

const main = async () => {
    {
        /**
         * успешные входящие вызовы
         */
        const json = {
            date_from: '1529020800',
            date_to: '1529107200',
            incoming: true,
            success: true,
        };
        const {
            success,
            stats
        } = await vpbx.stats(json);
        console.log(success, stats.length);
    }

    {
        /**
         * неуспешные исходящие вызовы
         */
        const json = {
            date_from: '1529020800',
            date_to: '1529107200',
            outgoing: true,
            fail: true,
        };
        const {
            success,
            stats
        } = await vpbx.stats(json);
        console.log(success, stats.length);
    }
};

main();
