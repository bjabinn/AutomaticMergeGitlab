const request = require('request');
const git = require('nodegit');
var fse = require("fs-extra");
var oid, head, repo, signature, index



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

// // //Elimina el proyecto en el repositorio
   fse.remove(projectElement.name).then(function(){
// // //         //Clona el proyecto de la rama que se especifique en cloneOption
         git.Clone(urlRepo,projectElement.name,cloneOptions).then(function(){
              //Me devuelve el repositorio que estoy utilizando
          git.Repository.open(projectElement.name).then(function(resultRepo){
               repo = resultRepo
         }).then(function(){
               return repo.getHeadCommit().catch(console.error)
         }).then(function(targetCommit){
               console.log("Me crea un branch, targetcommit: "+targetCommit)
               return repo.createBranch(mrsForBuild[0].source_branch, targetCommit, false).catch(console.error)
         }).then(function(resultReference){
               reference = resultReference
               console.log("Me enlaza la rama con el origen")
               return git.Branch.setUpstream(reference, "origin/"+mrsForBuild[0].source_branch).catch(console.error)
         }).then(function(){
               return  repo.checkoutRef(reference, {}).catch(console.error)
         }).then(function () {
          console.log("Toma referencia del commit")
               return repo.getReferenceCommit("refs/remotes/origin/" + mrsForBuild[0].source_branch).catch(console.error)
          }).then(function (commit) {
               console.log("Me actualiza el contenido")
               return git.Reset.reset(repo, commit, 3, {}).catch(console.error)
          }).then(function(){
               //// Realiza un pull a la rama source
               console.log("Realiza un pull")
                         return repo.mergeBranches(mrsForBuild[0].source_branch, mrsForBuild[0].source_branch, signature)
          }).then(function(){
               //// Realiza un merge desde la rama target
               console.log("Realiza un merge desde la target")
                         return repo.mergeBranches(mrsForBuild[0].source_branch, mrsForBuild[0].target_branch, signature)
          }).then(function(){
               console.log("Me realiza un push")
               ////Me realiza el push
                    repo.getRemote('origin').then(function(remote){
                    return remote.push(
                         ['refs/heads/'+mrsForBuild[0].source_branch+":refs/remotes/origin/"+mrsForBuild[0].source_branch],
                         {
                              callbacks: { 
                                   credentials: function() {
                                        return git.Cred.userpassPlaintextNew("jbeltrma@everis.com", "va5Kuge,,,");
                                   }
                              }
                         }
                    ).catch(console.error)
               }).catch(console.error)
          })
          }).catch(console.error())
     })
}






request(optionsGetProjects, getProjects);






