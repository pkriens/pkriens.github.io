---
title: Security Architecture
description: An overview of the security architecture
index: 1000
layout: openapi
---

# OpenAPI Security

## Introduction

The Open API Suite Security implements the requirements regarding security in the Open API 2.0 specification. The OpenAPI Suite has a design supporting the three required security schemes using OpenAPI Authenticator services and more. 

Although called _security_ in the OpenAPI specification, this security is actually limited to _authentication_. This seems to imply that the answer from an OpenAPI Authenticator service is a simple boolean. However, in the OpenAPI specifications, it is possible to require multiple authenticators in any combination of `and` and  `or`. For example, it is (theorethically) possible to require a Basic Authentication `or` and OAuth authentication. It also frequently falls short of providing critical information. (For example, OAuth2 is not an authentication protocol.) Though this is extremely flexible the specification does lack the details of how this could be implemented. The OpenAPI Suite provides a full implementation by providing pragmatic implementations.

The set of OpenAPI 2.0 specifications security schemes is rather limited. However, the OpenAPI Suite allows the existing schemes to be used with other authentication schemes. For example, it is straighforward to implement rate limiting schemes, monitoring, or support more secure forms of Basic Authentication. 

The OpenAPI specifications are moot on the _authorization_ aspects of writing microservices. However, authentication is closely connected to authorization. The _identity_ that is established with authentication is used to link to the set of _permissions_ that the request has. Unfortunately, in Java this is an area with lots of choices and even a number of false starts. For this reason, it handles all security decisions through a lightweight service. It provides an implementation based on Apache Shiro and OSGi User Admin for out of the box operations.

## Essentials

* _Basic Authentication_ – Supports basic authentication as defined in [RFC 2617][1].
* _API Key_ – Verification of a header or query parameter
* _OAuth2_ – Redirects the browser to another side for authentification
* _Flexible_ – Applications can provide their own services for special schemes
* _Off the shelf_ – Large number of OpenAPI Authenticators included out of the box
* _Authorization_ – Leverage the OSGi enRoute Authority service to access Shiro, User Admin, or custom authorization schemes.

## Entities

* _OpenAPI Runtime_ – The runtime that executes the microservice requests.
* _OpenAPI Authenticator_ – Implements a named OpenAPI specification security scheme. These names are global and shared within a framework.
* _OpenAPI Security Environment_ – Represents the user information for the OpenAPI suite. OpenAPI Authenticators can use this class to get/set user defined properties and credentials to authenticate a user. The OpenAPI runtime uses this class to verify the permissions.
* _OpenAPI Base_ – The base class used for microservices.
* _Servlet_ – The actual servlet used for dispatching microservice requests

## Architecture

The OpenAPI security architecture provides a pluggable system for the myriad of authentication and authorisation systems out there. It does this with a number of services. The service diagram is depicted in the following picture:

![OpenAPI Security Diagram](https://user-images.githubusercontent.com/200494/28419791-75045ff2-6d60-11e7-881e-9f7a473a46a7.png)


## Security Definitions

The OpenAPI Specification has a `securityDefinitions` section in the prolog. In this section, different authenticators that are later used for the operations can be defined. Each definition will get a name, a type, and the parameters for the defined type. 

In the OpenAPI suite the names used for the security definitions are _globals_ during runtime. They are mapped to services properties of the OpenAPI Authenticator.

An OpenAPI security section definining a basic authenticator called `basicauth` looks like:

               "swagger": "2.0",
               "securityDefinitions": {
                    "basicauth": {
                        "type": "basic"
                    }
               }

Basic Authentication has no parameters.
 
During runtime, this will refer to a service with the following properties:

    objectClass     OpenAPIAuthenticator
    openapi.name            basicauth
    openapi.type            basic

There should only be one `OpenAPIAuthenticator` service with these properties registered.

## OpenAPI Specification Security Section

The `security` section can be defined in the prolog and overridden for each operation. In the prolog it defines the default security that is applied when no `security` section is defined in an operation. The `security` section primarily refers to a security definition although in the case of OAuth it can provide additional parameters for the local check. It looks as follows:

               "security": [ {
                         "basicauth":[]
               } ]

The security section is an array of _security requirements_. Each member of the array is an alternative. That is, any of the security requirements can match to succeed. The security requirement is a map where the keys are the names of the security definitions and the value is an array holding additional parameters. If you think this allows for mindboggling complex authentication schemes then we agree.

## Security During Runtime

The code generated from the security information will authenticate the user just before the validation and the actual call to the microservice implementation. The authentication phase will try to find one of the alternative security requirements. However, this is harder then it sounds. Some authentication schemes can request credentials or take some action so that they can be authenticated. However, if one of the security requirements succeeds there should be no need to ask for credentials. The authentication code will therefore try to find a security requirement that succeeds. Not that this is non-trivial since there each security requirement is part of an `and`/`or` combination.

If no security requirement succeeds authentication, the first OpenAPI Authenticator that could request credentials is asked to ask the caller to provide credentials. Note that this can result in a number of roundtrips since a security requirement can have siblings that all need to authenticate.

For example, Basic Authentication checks the Authorization header. If there is no such header it can request such a header by setting the WWW-Authenticate header and returning a 403 error code to the caller. The Basic Authentication OpenAPI Authenticator will there indicate that it is not authenticated but it could set the response to request credentials. If the OpenAPI Runtime cannot find another OpenAPI Authenticator that says it is authenticated it will ask the Basic Authentication OpenAPI Authenticator service to request the credentials.

If in the end a security requirement and its `and` subling succeeds, the first security requirement in the OpenAPI source file is selected to provide the authenticated user. 

If no authenticated user can be established, the request is executed with the _anonymous user_. This is the user represented by `null`. That is, authentication will never prohibit calling the microservice implementation, microservices should always verify their required permissions.

This sounds (and is) complicated. However, in most of the cases there is only a single security provider in play, which greatly simplifies the setup.

## The OpenAPI Security Environment Service

The best asset of Java is the unsurpassed richness of its environment. The worst of Java is the myriad of choices developers have to make, choices that often constraint other choices. There are hundreds of security protocols and for each protocol there are different solutions in Java. Each of these solutions must make a choice about the following questions:

* How to model a user,
* How to set and get credentials of a user,
* How to pass the authenticated user to the microservice implementations.

One possible candidate would be to use [Apache Shiro][shiro]. This is an API that is OSGi compatible and provides an elegant abstraction for the aforementioned questions without dragging in too many dependencies. For this reason, Apache Shiro is supported out of the box. However, there are other solutions out there and sometimes very simple solutions will do. For this reason, the OpenAPI Security Environment service uses its own API and provides bridges to other environments. For many applications it is likely that the application will implement this service to bind it to the implementations it requires.

In the following sections the aspects of the OpenAPI Security Environment service are discussed. Consult the Java docs for the finer details.

### User Identity

The most straightforward authentication mechanism  for the web is _Basic Authentication_. This protocol adds an Authorization header to the request containing the user id and the password. The OpenAPI suite Basic Authentication Security Provider can parse this header. However, it will need to understand what the user identity actually is in the environment it runs. 

It is good practice that the actual identity is not the same as the name used in a login. For example, a common practice is to use the email address of a user to _identify_ the user. However, using that email address as the user identity is generally a decision that will be regretted once the user _changes_ his email address. Best practice is to make the user identity some random number that has no semantics. The email address is then a property of the user. The Basic Authentication OpenAPI Authenticator will therefore find a user identity by looking for a user with the property `email=credential`. 

This indirection is generally the case for OpenAPI Authenticator service implementations. For example, OAuth2 with OpenID generally returns an email address as well. 

The following table shows 

    #id          email          first_name           last_name
    1232423      john@doe.com   John                  Doe
    6435234      mary@doe.com   Mary                  Doe


The OpenAPI Security Environment service has a method that allows finding a user by a providing a property (key and value) that must be a property of a single user. Clearly, the key of this property (`email`) needs to be configurable because not all systems have the same conventions. In the OpenAPI suite the default is always `email` and can be overridden with a convention, including using the user identity directly.

### User Properties and Credentials

In the case of Basic Authentication the OpenAPI Authenticator must verify the password. Clearly, storing the password is simple but not a good idea. Most losses of passwords are caused by databases that got stolen. For this reason, a value is stored that can be calculated from the password but there is no function that can calculate the password from it, for example a _hash_. The Basic Authentication the OpenAPI Authenticator must clearly store this value somewhere. In practice, it can actually require to store multiple values since the safest known method is to store both a random number (the used salt) and the hash. 

For this reason, the OpenAPI Security Environment service provides a general store for _properties_ and _credentials_. Properties are `<String,String>` and credentials are `<String,byte[]>`. 

The OpenAPI Authenticator implementations must be able to read and write the properties and credentials. Though the need to read should be obvious, the need to write requires some explanation. 

The reason for the write is that the values that are used are highly coupled to the OpenAPI Authenticator implementation as well as its configuration. For example, the `email` key to link the information passed in an Authorization header is a configurable aspect of the Basic Authentication OpenAPI Authenticator service. 

However, this provider also has many different algorithms and other settings that define what kind of hash is stored. Although it is always possible to create an application component that has the same settings and knows how to calculate the proper hash, it is better to delegate this work to the actual security provider. For this reason, the OpenAPI Authenticator service implementations register a special service with domain specific methods. 

For example, the Basic Authentication OpenAPI Authenticator has a `setPassword` method. Common practice is to also provide a Gogo command and sometimes a Webconsole plugin. 

### Authorization

The OpenAPI Authenticator services are used to _authenticate_ a user. The take the credentials from a web request and through some protocol, which can include browser redirects, establish a _user identity_ for the caller. This user identity can include the anonymous user. 

The next step is to verify the _authorization_.  Since there are many different ways to authorize code, the OpenAPI suite delegates this task to the OpenAPI Security Environment service. When it has established a current user identity for the request it will call the `OpenAPISecurity.call(...)` method that receives the user identity and a lambda. The implementation of this service must then establish a _security context_ that remains valid during the execution of the lambda. The lambda will then call the microservice implementation.

This approach allows the application to use an application specific authorization model, the OpenAPI suite does not require the use of a specific authorization model.

Implementations will in general associate the security context with the current thread and provide some service used by the microservice implementations to get this context. 

For convenience, the base class OpenAPI Base provides the `hasPermission` and `checkPermission` methods that will directly call the Open API Security service, leaving the actual model in one place. However, there is no requirement to use these methods since a microservice implementation can instead call an application specific service for authorization.

    @Override
    public void foo() {
      hasPermission("foo");
    }

The following diagram shows the actions in this design:

![OpenAPI Security Context](http://www.plantuml.com/plantuml/png/ZLF1RiCW3Btp5ToQIEjsZwPArQH9EqohjYyWn5NGICZ0fEtVprdNXa3IxH01phEV_HxKgWA-DmPBSsH2eh7SEx33LlK2WR_x5bK3R8ZozMPp2HJy02MtyEN1uGZVUgo1059GAST-mPGO_Icu6CzmnJskrmdmfvyA_aFHTNe8AzCMN0gjio7tJekch4GUD3dYMB1FIZX0-gIt2azScXRXY772gvBM44kl96bofheNX3cDV266XOUqG6MUZSdoLFyuxMf3BTmERAESeuwo5NcvMXXrIQbf1IgGtrI5D4rLcHWOej5wUDWBxM3YuLnRYHZpkKkAn4BoWx6V4IgUnOBp6iFg4wzkoM2XCJtySJz2erAkK8MP0PcaQqwlRdYUjBnrq6vtBznvHQ2F2-_JcVSR)

### Why No Annotations To Check Permissions?

It would be simple to verify basic permissions using an annotation on the microservice implementation method. However, annotations have a number of drawbacks over plain old java code:

* `this` reference - A vexing problems with annotations is that no check takes place if the methods are called directly on the `this` reference. The design requires that another party, using a proxy to the `this` reference, verifies that the security is met. In practice, this resulted in cases where security was breached because methods with lower priority could call higher priority methods without doing the necessary permission check.
* Debugging – Checks are executed in the debugger and can be single stepped through.
* Testing – Testing always includes the permission check.
* Parameters – It is straightforward to pass dynamic parameters in the check, annotation can only access compile time information.
* Readability – Plain old java is easier to read and understand than annotations that might perform a lot of magic.

It would be possible to automatically check the user has permission to execute the OpenAPI operation id. File an enhancement if this is needed. Also annotations, though not recommended, can be added if so needed.
{:.note}

## The Open API Security Provider

The authentication of a web reqyest is delegated to the OpenAPI Authenticator service. A whiteboard service is used to allow many different authentication protocols to integrate seamlessly. 

Each Open API Security Provider service must register under the `OpenAPIAuthenticator` name and register the following service properties:

* `openapi.name` – The name as used in an OpenAPI specification for a `securityDefinition`. 
* `openapi.type` – The OpenAPI Specification type name. This is `apiKey`, `oauth2`, or `basic`. The OpenAPI supports custom types but it is recommended to start these with `x-`.

### The Authentication Object

The primary responsibility of the an OpenAPI Authenticator is to authenticate a web request. For this, the provider gets access to the full Http Servlet Request- and Response. Since the authentication is a multistage process due to the complexity of the the `and`/`or` combination of the OpenAPI specification security requirements, the OpenAPI Runtime requests an `Authentication` object from the OpenAPI Authenticator. This Authentication object is then used in a state machine to discover which provider can authenticate the request.

The provider must implement the following methods:

* `isAuthenticated` – Answers if the web request is authenticated, that is, the getUser() method returns an authenticated user.
* `needsCredentials` – Some authenticators can tell the browser to provide credentials, for example this works for Basic Authentication. The authenticator sends a special header and a special error code. 
* `requestCredentials` – If no authenticator can be found that has the user authenticated then the first authenticator that could request credentials gets control. This usually involves manipulating the Http Servlet Response to redirect or set headers and result codes.
* `ignore` – Ignore this authentication object. The reason this is provided so that the authentication mechanism can be used to inspect headers. For example, this makes it possible to implement rate limiting schemes.

### Login and Logout

An authorization protocol like OAuth2 requires that the browser is redirected to an authorization server. This poses a problem for code that calls a REST API. Although code could request credentials from the user and then use a REST call to authenticate this forfeits the purpose of OAuth2 that no credentials nor personal information is ever passing through the _client_. (In OAuth2 terms, the client is the code that needs to perform actions for a given user.) The OAuth2 protocol achieves this by redirecting the browser to the _authorization server_. On that server, the user authenticates, and through another redirection a token is either given to the browser code (implict flow) or the client (code grant flow). These flows are 100% user based and do require that there is a human at the keyboard, REST calls can not help here.

For this, every authenticator is accessible through a URI on the local server. 

    /.openapi/security/<openapi.name>/<openapi.type>/<command>
    
The following commands are supported:

* login – Start an authenticator specific login procedure. The URI can require authenticator specific parameters. After this call succeeds the http session is normally associated with the authenticated user. Subsequent calls from the same browser will then more quickly be authenticated.
* logout – Start an authenticator specific logout procedure. The URI can require authenticator specific parameters. Generally, this will remove any authenticated users from the Http session with the browser.
* ... – Any other command is forwarded to the authenticator. This can, for example, be used for URL based callbacks like used in OAuth2.


### Single Page Web Apps

When an application is a single based web app this poses a problem. Redirection to another page closes the single page web app and this thereby loses its state, which can be expensive.

A single page web app can hardcode the logins of the available authenticator in its GUI on a general login screen, like for example:

![Stackoverflow Login Window](https://user-images.githubusercontent.com/200494/28422143-76ce71cc-6d67-11e7-9045-8ed5b2372858.png)

If the user clicks on one of the authentication buttons the single page web app should open a new window or tab and set the location of that window to the proper URI of the authenticator login. For example, `/.openapi/security/google/oauth2/login`, assuming there is an OAuth2 authenticator configured for Google. 

The OAuth2 Google authenticator will then redirect the window to the Google authorization page. Google will redirect to our authenticator and provides the token or an error. The authenticator then redirects the browser to a special _closing_ page. The closing page should close the login window. The actual URI for the closing page is always configurable for each authenticator. That said, it is likely that only one closing page is needed for a single page web app.

Since the original single page web app is likely to be interested in the result of the login flow, the authenticator adds a number of parameters to the closing page URI. At least the following parameters are added:

* `error` – An error code. This error code uses the OAuth2 defined error codes. If the flow succeeded then the error code witll be `ok`. Any custom error codes are prefixed with `x_`. 
* `error_description` – A description of the error that happened.

It is up to the closing page how the window is closed and the result is communicated to the single page web app. One possible mechanisms is to use the HTML 5 `sendMessage` support. This mechanism is used in the authentication example which is part of the OpenAPI suite.

The logout flow is usually simpler. It consists of removing any authentication state from the current Http session. However, it use the same separate window flow.

### Reflection on Authenticators

The OpenAPI Runtime can provide the current set of authenticators to the browser with a REST call. The URI for this call is `/.openapi/security` (unless configured otherwise). The result is a JSON aray with `OpenAPISecurityProviderInfo` objects. These objects provide sufficient information to create an automatic login page if so needed.

### Included Authenticators

The OpenAPI suite provides the following authenticators. Refer to their readme.md file for features and configuration information. These authenticators can be used in industrial applications since they are hardened against known attacks.

* `biz.aQute.openapi.basicauth.provider` – Implements the Http Basic Authentication protocol.
* `biz.aQute.openapi.oauth2.provider` – Implements the OAuth2 protocol. Since OAuth2 is not an authentication protocol it requires a specific call to an authorized server to get authentication data. This bundle implements [OpenID Connect], an emerging standard that includes the authentication data in the OAuth2 response, and a number of well known authentication sites like Github and Google. 


[1]: https://github.com/aQute-os/biz.aQute.openapi/tree/master/biz.aQute.openapi.basicauth.example
[RFC 2617]: https://www.ietf.org/rfc/rfc2617.txt
[Amazon Signing Version 4]: http://docs.aws.amazon.com/general/latest/gr/signature-version-4.html
[shiro]: https://shiro.apache.org/
[OpenID Connect]: http://openid.net/connect/
