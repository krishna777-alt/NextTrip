const express = require('express');
const agentController = require('./../controllers/agentController');

const router = express.Router();

router.get('/logout',agentController.logout);

router.route('/login')
.get(agentController.getLogin)
.post(agentController.login);

router.route('/register')
 .get(agentController.getRegister)
 .post(agentController.register);
// .post(agentController.login);
/////////////////////////////////////////////////////
router.get('/',
    agentController.auth,
    agentController.isAgent,
    agentController.getAgent);

router.route('/addPackage')
    .get(agentController.auth,
        agentController.isAgent,
        agentController.getAddPackage)
    .post(agentController.uploadPackageImage,
        agentController.auth,
        agentController.addPackage);


router.route('/agentPackage').get(agentController.auth,agentController.displayAgentPackage);  

router.route('/profile').get(agentController.agentProfile);

module.exports = router;