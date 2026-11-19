import Storage from '@janiscommerce/app-storage';

// Own instance so the package's keys never collide with the app's own storage
const storage = new Storage({id: 'app-check-updates'});

export default storage;
