const request = require('request');
const git = require('nodegit');
var fse = require("fs-extra");
var oid, head, parent, repo, signature



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
       var cloneOptions = {
          fetchOpts: {
               callbacks: {                    
                    credentials: () => git.Cred.userpassPlaintextNew("jbeltrma@everis.com", "va5Kuge,,,"),               
                    
               }
          },
          checkoutBranch: mrsForBuild[0].target_branch
       }
   signature = git.Signature.now("jbeltran", "jbeltrma@everis.com")

//Elimina el proyecto en el repositorio
   fse.remove(projectElement.name).then(function(){
        //Clona el proyecto de la rama que se especifique en cloneOption
         git.Clone(urlRepo,projectElement.name,cloneOptions).then(function(){
              //Me devuelve el repositorio que estoy utilizando
               git.Repository.open(projectElement.name).then(function(resultRepo){
                    repo = resultRepo
                    //Me crea el branch dentro de mi repo local
                    repo.getHeadCommit().then(function(targetCommit){
                         return repo.createBranch(mrsForBuild[0].source_branch, targetCommit, false)
                    }).then(function(reference){
                    //Cambia de un branch a otro
                         return repo.checkoutBranch(reference, {});
                    }).then(function () {
                         return repo.getReferenceCommit(
                           "refs/remotes/origin/" + mrsForBuild[0].source_branch);
                    }).then(function (commit) {
                         git.Reset.reset(repo, commit, 3, {});
                         //Realiza un fetch
                   }).catch(function(e){console.log(e)})
                         return repo.fetchAll({
                              callbacks: {
                                credentials: function() {
                                  return git.Cred.userpassPlaintextNew("jbeltrma@everis.com", "va5Kuge,,,");
                                },
                                certificateCheck: function() {
                                  return 0;
                                }
                              }
                            });
                    }).then(function(){
                         //Realiza un pull a la rama source
                              return repo.mergeBranches(mrsForBuild[0].source_branch, mrsForBuild[0].source_branch);
                    }).then(function(){
                         //Realiza un merge a la rama target
                              return repo.mergeBranches(mrsForBuild[0].source_branch, mrsForBuild[0].target_branch);
                    }).then(function(){
                         //Actualiza el nuevo contenido
                         return repo.refreshIndex().then(function(index){
                                index.addByPath(projectElement.name)
                                index.write();
                                return index.writeTree();
                         }).then(function(oidResult){
                              oid = oidResult
                              return git.Reference.nameToId(repo, 'HEAD');
                         }).then(function(resultHead){
                              head = resultHead
                         })
                         .catch(function(e){
                              console.log(e)
                         }).then(function(){
                            return repo.getCommit(head);
                         })
                         .then(function(parent) {
                              //Me crea un commit 
                               return repo.createCommit("HEAD", signature, signature,"Merge of branch_target to branch_source", oid, [parent]);
                         }).then(function(commitId) {
                               return console.log('New Commit: ', commitId);
                         }).catch(console.error)
                    }).then(function(){
                         //Me realiza el push (Error)
                         repo.getRemote('origin').then(function(remote){
                              return remote.push(
                                   ["refs/remotes/origin"+mrsForBuild[0].source_branch+":"+"refs/remotes/origin"+mrsForBuild[0].source_branch],
                                   {
                                        callbacks: { 
                                             credentials: function() {
                                                  return git.Cred.userpassPlaintextNew("jbeltrma@everis.com", "va5Kuge,,,");
                                             }
                                        }
                                   }
                              )
                         }).catch(console.error)
                          }) 
                }).catch(function(e){console.log(e)})
               })
}









request(optionsGetProjects, getProjects);






