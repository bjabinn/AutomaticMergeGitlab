const request = require('request');
const git = require('nodegit');
const path = require('path');


const gitRepositoryHost = '10.45.17.147';
const gitRepositoryHTTPURL = 'http://' + gitRepositoryHost;
const getMRForBuildService = '/api/v4/groups/2/merge_requests?scope=all&utf8=%E2%9C%93&state=opened&labels=Build';
//const getMRForBuildService = '/api/v4/groups/2/merge_requests?scope=all&utf8=%E2%9C%93&state=opened';
//const gitRepositoryLocalPath = '/c/Dev/EMA/CT2/Projects/ClinicalTrialRepositories';
const gitMergeRequest = "/projects/:id/merge_requests/:merge_request_iid";

var gitProjects = '';
var mrsForBuild = '';

const optionsGetProjects = {
   url: gitRepositoryHTTPURL + '/api/v4/groups/2/projects',
   headers: {
	'Private-Token':'AemHTsY3N6cvDbMiAh6v',
	'Content-Type': 'application/json'
   }
}


const optionsGetMRForBuild = {
   url: gitRepositoryHTTPURL + getMRForBuildService,
   headers: {
	'Private-Token':'AemHTsY3N6cvDbMiAh6v',
	'Content-Type': 'application/json'
   }
}


function getProjects(error, response, body) {
  if (!error && response.statusCode == 200) {
    gitProjects= JSON.parse(body);

    request(optionsGetMRForBuild, getMRForBuild);

  }else{
    console.log("Error consultando");
  }
}

function getMRForBuild(error, response, body) {
  if (!error && response.statusCode == 200) {
    mrsForBuild = JSON.parse(body);
    if (mrsForBuild.length != 0){
      var projectElement = gitProjects.find(
        function(element) {
          return element.id == mrsForBuild[0].project_id;
        });
        console.log(mrsForBuild[0]);
        console.log("GitD.sh Parameter 1 -> Project Name:" + projectElement.name)
        console.log("Llamada a realizar en " + mrsForBuild[0].title + ": gitD.sh "+ projectElement.name + " " + mrsForBuild[0].source_branch)
        let urlRepo = "http://10.45.17.147/ClinicalTrialRepositories/"+projectElement.name+".git"
        var pathToRepo = require("path").resolve("./"+projectElement.name);

        var errorAndAttemptOpen = function() { 
          let resultado =  git.Repository.open(pathToRepo);           
          return resultado;
        };      
        
        all(urlRepo, mrsForBuild, projectElement);

  }else{
    console.log("Error consultando");
  }
}}

function all(urlRepo, mrsForBuild, projectElement){
       //Credencial y Rama Principal
       var cloneOptions = {
          fetchOpts: {
               callbacks: {                    
                    credentials: () => git.Cred.userpassPlaintextNew("psusinor@everis.com", "psusinor2019"),               
                    
               }
          },
          checkoutBranch: mrsForBuild[0].target_branch
       }

     

//Clonación del repositorio con credenciales y rama
     git.Clone(urlRepo, projectElement.name, cloneOptions)
          .then(function(){
               console.log("<========= Comprobando repositorio=========>")})
          .then(function(){
               console.log("<========= Repositorio listo: "+projectElement.name+" =========>")})
          .catch(function(){
               console.log("<========= El repositorio ya esta creado: "+projectElement.name+" ==========>")})
          .then(function(){
               git.Repository.open(projectElement.name)
               .then(function(repo){
                    return repo.getCurrentBranch().then(function(ref) {
                         console.log("<========= Estas en la Rama: " + ref.shorthand() + "===========>");
                }).then(function(){
                    return repo.getHeadCommit()
                         .then(function(commit){
                              return repo.createBranch(mrsForBuild[0].source_branch, commit)
                         .then(function(){
                              console.log("<=========  Branch creado  =========>")})
                         .catch(function(){
                              console.log("<========= Branch Listo ========>") })
                          .then(function(){
                              repo.checkoutBranch(mrsForBuild[0].source_branch, {})
                         .then(function(){
                                   console.log("<========= checkout realizado cambiando a la Rama: "+ mrsForBuild[0].source_branch+" ============>")})
                         .catch(function(e){
                              console.log("Error checkout "+e)})
                         .then(function(){
                                      return repo.fetchAll({  callbacks: {                    
                                        credentials: () => git.Cred.userpassPlaintextNew("psusinor@everis.com", "psusinor2019"),               
                                   }});
                                 
                         })                             
                              // Now that we're finished fetching, go ahead and merge our local branch
                              // with the new one
                              .then(function() {
                                return repo.mergeBranches(mrsForBuild[0].source_branch, mrsForBuild[0].source_branch);
                              }).then(function(){
                                   console.log("<========= Pull realizado de la Rama auxiliar ============>");})
                              .catch(function(e){console.log("Error al realizar el Pull "+e)}) 
                              .then(function(){
                                   return repo.fetchAll({callbacks: {                    
                                     credentials: () => git.Cred.userpassPlaintextNew("psusinor@everis.com", "psusinor2019"),                      
                                }});
                               })                         
                              .then(function(){
                                   var signature = git.Signature.now("Pedro Susín", "psusinor@everis.com");
                                   repo.mergeBranches(mrsForBuild[0].target_branch, mrsForBuild[0].source_branch)})
                              .then(function(){
                                        console.log("<========= Merge de la Rama Principal a la Rama auxiliar realizado ============>")})
                              .catch(function(e){console.log("Error al realizar el Merge "+e)})
                              
                                   // .then(function(){
                                   //      return repo.getRemote("origin", projectElement.name)})
                                   // .then(function(remoteResult){
                                   //      return remoteResult.push(),
                                   //      console.log("Push realizado")
                                   // })
                              //})
                         
                    })
               })
          })
               
     })

}).catch(function(err){
     console.log("ERROR: "+ err)
})
}



//  function getCLoneRepo(urlRepo,mrsForBuild, projectElement){
//      //Credencial y Rama Principal
//           var cloneOptions = {
//                fetchOpts: {
//                     callbacks: {                    
//                          credentials: () => git.Cred.userpassPlaintextNew("psusinor@everis.com", "psusinor2019"),               
                         
//                     }
//                },
//                checkoutBranch: mrsForBuild[0].target_branch
               
//           };

//      //Clonación del repositorio con credenciales y rama
//      git.Clone(urlRepo, projectElement.name, cloneOptions)
//                .then(function(repository){
//                     console.log("Repositorio creado: "+repository)
//                .catch(function(err){
//                     console.log("error al clonar" + err)
//                })
//        });
// }

//  function createBranch(mrsForBuild, projectElement){
//      git.Repository.open(projectElement.name).then(function(repo){
//          return repo.getCurrentBranch().then(function(branch){
//               if(branch.shorthand()===mrsForBuild[0].source_branch){
//                return repo.getHeadCommit().then(function(commit){
//                     return repo.createBranch(mrsForBuild[0].source_branch, commit).then(function(){
//                          console.log("Branch creado");
//                     })
//                }).catch(function(err){
//                     console.log("Error al crear el branch")
//                })
//                }else{
//                     console.log("El branch ya esta creado")
//                }
//           })
//           })
// }

//  function checkBranchSource(projectElement, mrsForBuild){
//      // var checkoutOpts = {
//      //      checkoutStrategy: git.Checkout.STRATEGY.FORCE
//      //    };
//       git.Repository.open(projectElement.name)
//      .then(function (reference) {
//            return reference.checkoutBranch(mrsForBuild[0].source_branch, {}).then(function(){
//                 console.log("checkout realizado");
//            }).catch(function(err){
//                 console.log("Error al realizar el checkout "+ err);
//            })
//       });
// }

//  function getCurrentBranch(projectElement){
//       git.Repository.open(projectElement.name)
//           .then(function(repository) {
//           /* Get the current branch. */
//           return repository.getCurrentBranch().then(function(ref) {
//             console.log("Estas en la Rama: " + ref.shorthand());
//            }).catch(function(err){
//                 console.log("Error al consultar la rama "+ err)
//            })
//        })
// }

//  function mergeRepo(){
//       git.Repository.open(projectElement.name)
//           .then(function(repo){
//           return repo.mergeBranches().then(function(){
//                console.log("Merge realizado de la Rama principal a la Rama auxiliar");
//           }).catch(function(err){
//                console.log("Error al realizar el Merge "+ err)
//           })
//      })
// }

// // get
// var fetchOpts = cloneOptions;
// return repo.fetchAll(fetchOpts)
// }).then(function(){
//     return repo.mergeBranches(mrsForBuild[0].source_branch, mrsForBuild[0].source_branch)

request(optionsGetProjects, getProjects);






