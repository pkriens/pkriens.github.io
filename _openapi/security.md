
# Open API Security

## Introduction

The Open API Suite Security implements the requirements regarding security in the Open API 2.0 specification. The OpenAPI Suite has a design supporting the three required security schemes using OpenAPI Security Provider services and more. 

Although called _security_ in the OpenAPI specification, this security is actually limited to _authentication_. This seems to imply that the answer from an OpenAPI Security Provider service is a simple boolean. However, in the OpenAPI specifications, it is possible to require multiple security providers in any combination of `and` and  `or`. For example, it is (theorethically) possible to require a Basic Authentication `or` and OAuth authentication. It also frequently falls short of providing critical information. (For example, OAuth2 is not an authentication protocol.) Though this is extremely flexible the specification does lack the details of how this could be implemented. The OpenAPI Suite provides a full implementation by providing pragmatic implementations.

The set of OpenAPI 2.0 specifications security schemes is rather limited. However, the OpenAPI Suite allows the existing schemes to be used with other authentication schemes. For example, it is straighforward to implement rate limiting schemes, monitoring, or support more secure forms of Basic Authentication. 

The OpenAPI specifications are moot on the _authorization_ aspects of writing microservices. However, authentication is closely connected to authorization. The _identity_ that is established with authentication is used to link to the set of _permissions_ that the request has. Unfortunately, in Java this is an area with lots of choices and even a number of false starts. For this reason, it handles all security decisions through a lightweight service. It provides an implementation based on Apache Shiro and OSGi User Admin for out of the box operations.

## Essentials

* _Basic Authentication_ – Supports basic authentication as defined in [RFC 2617][1].
* _API Key_ – Verification of a header or query parameter
* _OAuth2_ – Redirects the browser to another side for authentification
* _Flexible_ – Applications can provide their own services for special schemes
* _Off the shelf_ – Large number of OpenAPI Security Providers included out of the box
* _Authorization_ – Leverage the OSGi enRoute Authority service to access Shiro, User Admin, or custom authorization schemes.

## Entities

* _OpenAPI Runtime_ – The runtime that executes the microservice requests.
* _OpenAPI Security Provider_ – Implements a named OpenAPI Security Scheme. Names are global and shared within a framework.
* _OpenAPI Security_ – Represents the user information for the OpenAPI suite. OpenAPI Security Providers can use this class to get/set user defined properties and credentials to authenticate a user. The OpenAPI runtime uses this class to verify the permissions.
* _OpenAPI Base_ – The base class used for microservices.
* _Servlet_ – The actual servlet used for dispatching microservice requests

## Architecture

The OpenAPI security architecture provides a pluggable system for the myriad of authentication and authorisation systems out there. It does this with a number of services. The service diagram is depicted in the following picture:

![OpenAPI Security Diagram](https://user-images.githubusercontent.com/200494/28373206-0c07149a-6ca2-11e7-80b9-340fd56e7f0f.png)


## Security Definitions

The OpenAPI Specification has a `securityDefinitions` section in the prolog. In this section, different security providers that are later used for the operations can be defined. Each definition will get a name, a type, and the parameters for the defined type. 

In the OpenAPI suite the names used for the security definitions are _globals_ during runtime. They are mapped to services properties of the OpenAPI Security Provider.

An OpenAPI security section definining a basic authentication provider called `basicauth` looks like:

               "swagger": "2.0",
               "securityDefinitions": {
                    "basicauth": {
                        "type": "basic"
                    }
               }

Basic Authentication has no parameters.
 
During runtime, this will refer to a service with the following properties:

    objectClass     OpenAPISecurityProvider
    name            basicauth
    type            basic

There should only be one `OpenAPISecurityProvider` service with these properties registered.

## OpenAPI Specification Security Section

The `security` section can be defined in the prolog and overridden for each operation. In the prolog it defines the default security that is applied when no `security` section is defined in an operation. The `security` section primarily refers to a security definition although in the case of OAuth it can provide additional parameters for the local check. It looks as follows:

               "security": [ {
                         "basicauth":[]
               } ]

The security section is an array of _security requirements_. Each member of the array is an alternative. That is, any of the security requirements can match to succeed. The security requirement is a map where the keys are the names of the security definitions and the value is an array holding additional parameters. If you think this allows for mindboggling complex authentication schemes then we agree.

## Security During Runtime

The code generated from the security information will authenticate the user just before the validation and the actual call to the microservice implementation. The authentication phase will try to find one of the alternative security requirements. However, this is harder then it sounds. Some authentication schemes can request credentials or take some action so that they can be authenticated. However, if one of the security requirements succeeds there should be no need to ask for credentials. The authentication code will therefore try to find a security requirement that succeeds. If no security requirement succeeds, the first OpenAPI Security Provider that could request credentials is asked to ask the caller to provide credentials.

For example, Basic Authentication checks the Authorization header. If there is no such header it can request such a header by setting the WWW-Authenticate header and returning a 403 error code to the caller. The Basic Authentication OpenAPI Security Provider will there indicate that it is not authenticated but it could set the response to request credentials. If the OpenAPI Runtime cannot find another OpenAPI Security Provider that says it is authenticated it will ask the Basic Authentication OpenAPI Security Provider service to request the credentials.

This sounds (and is) complicated. However, in most of the cases there is only a single security provider in play, which greatly simplifies the setup.

## The OpenAPI Security Service

The best asset of Java is the unsurpassed richness of its environment. The worst of Java is the myriad of choices developers have to make, choices that often constraint other choices. There are hundreds of security protocols and for each protocol there are different solutions in Java. Each of these solutions must make a choice about the following questions:

* How to model a user,
* How to set and get credentials of a user,
* How to pass the authenticated user to the microservice implementations.

One possible candidate would be to use [Apache Shiro][shiro]. This is an API that is OSGi compatible and provides an elegant abstraction for the aforementioned questions without dragging in too many dependencies. For this reason, Apache Shiro is supported out of the box. However, there are other solutions out there and sometimes very simple solutions will do. For this reason, the OpenAPI Security service uses its own API and provides bridges to other environments. For many applications it is likely that the application will implement this service to bind it to the implementations it requires.

In the following sections the aspects of the OpenAPI Security service are discussed. Consult the Java docs for the finer details.

### User Identity

The most straightforward authentication mechanism  for the web is _Basic Authentication_. This protocol adds an Authorization header to the request containing the user id and the password. The OpenAPI suite Basic Authentication Security Provider can parse this header. However, it will need to understand what the user identity actually is in the environment it runs. 

It is good practice that the actual identity is not the same as the name used in a login. For example, a common practice is to use the email address of a user to _identify_ the user. However, using that email address as the user identity is generally a decision that will be regretted once the user _changes_ his email address. Best practice is to make the user identity some random number that has no semantics. The email address is then a property of the user. The Basic Authentication OpenAPI Security Provider will therefore find a user identity by looking for a user with the property `email=credential`. 

This indirection is generally the case for OpenAPI Security Provider service implementations. For example, OAuth2 with OpenID generally returns an email address as well. 

The following table shows 

    #id          email          first_name           last_name
    1232423      john@doe.com   John                  Doe
    6435234      mary@doe.com   Mary                  Doe


The OpenAPI Security service has a method that allows finding a user by a providing a property (key and value) that must be a property of a single user. Clearly, the key of this property (`email`) needs to be configurable because not all systems have the same conventions. In the OpenAPI suite the default is always `email` and can be overridden with a convention, including using the user identity directly.

### User Properties and Credentials

In the case of Basic Authentication the OpenAPI Security Provider must verify the password. Clearly, storing the password is simple but not a good idea. Most losses of passwords are caused by databases that got stolen. For this reason, a value is stored that can be calculated from the password but there is no function that can calculate the password from it, for example a _hash_. The Basic Authentication the OpenAPI Security Provider must clearly store this value somewhere. In practice, it can actually require to store multiple values since the safest known method is to store both a random number (the used salt) and the hash. 

For this reason, the OpenAPI Security provides a general store for _properties_ and _credentials_. Properties are `<String,String>` and credentials are `<String,byte[]>`. 

The OpenAPI Security Provider implementations must be able to read and write the properties and credentials. Though the need to read should be obvious, the need to write requires some explanation. 

The reason for the write is that the values that are used are highly coupled to the OpenAPI Security Provider implementation as well as its configuration. For example, the `email` key to link the information passed in an Authorization header is a configurable aspect of the Basic Authentication OpenAPI Security Provider service. 

However, this provider also has many different algorithms and other settings that define what kind of hash is stored. Although it is always possible to create an application component that has the same settings and knows how to calculate the proper hash, it is better to delegate this work to the actual security provider. For this reason, the OpenAPI Security Provider implementations register a special service with domain specific methods. 

For example, the Basic Authentication OpenAPI Security Provider has a `setPassword` method. Common practice is to also provide a Gogo command and sometimes a Webconsole plugin. 

### Authorization

The OpenAPI Security Provider services are used to _authenticate_ a user. The take the credentials from a web request and through some protocol, which can include browser redirects, establish a _user identity_ for the caller. This user identity can include the anonymous user. 

The next step is to verify the _authorization_.  Since there are many different ways to authorize code, the OpenAPI suite delegates this task to the OpenAPI Security service. When it has established a current user identity for the request it will call the `OpenAPISecurity.call(...)` method that receives the user identity and a lambda. The implementation of this service must then establish a _security context_ that remains valid during the execution of the lambda. The lambda will then call the microservice implementation.

This approach allows the application to use an application specific authorization model, the OpenAPI suite does not require the use of a specific authorization model.

Implementations will in general associate the security context with the current thread and provide some service used by the microservice implementations to get this context. 

For convenience, the OpenAPI Context provides the `hasPermission` and `checkPermission` methods that will directly call the Open API Security service, leaving the actual model in one place. However, there is no requirement to use this since a microservice implementation can always call an application specific service.

The following diagram shows the action diagram of this design:

![OpenAPI Security Context](http://www.plantuml.com/plantuml/png/XP5D2i8m44RtFSNiseBr04K44GGNejGJn3XYiCsKIUBFxOsqOjjWkmXPpCkR-IQ5qrPL2DaILdLTAYci8fs356MPE8CyAqLrEeiqwfG3sg3rHpfMzWMIjCMd7JxOASdaXNSbCOV6EXUUUKNTKeYUQKEKf05LDAFdS1NcW5mfOtoh9BuGnMbK_0dMXpqxdiol84psTI-oh4ypMiVwrpl8qW9JWU51V1jGmybQrTZmZ1NTSU9dkfjidP543pBuxNokVOrwTTY2SSeY7B-sTMDx0m00)
















-----------------------





* Type is Basic Authentication
* Security definition name is `basicauth`

The following bundles are required to provide an OpenAPI Service Provider and Authority service based on User Admin.

* `biz.aQute.openapi.security.useradmin.provider` – Provides a configurable basic authentication provider. The key used in useradmin to find the given user name is configurable as is the salt and the hash used. It also provides a Gogo command to set and remove basic authentication ids and their hashed+salted password.
* `biz.aQute.useradmin.util` – Provides an implementation of the OSGi enRoute Authority based on the OSGi User Admin. Also here with a Gogo command to manipulate the users in User Admin.

## Authentication

Authentication is the process of establishing a trusted identity for a user. The Internet has spawned thousands of protocols describing how to authenticate users. The OpenAPI suite defins the OpenAPI Security Provider service as an abstraction for these protocols. Although some protocols are simply userid password verifications like Basic Authentication, other protocols implement complex redirect flows. However, even Basic Authentication requires more than just answering a simple question. If the Authorization header is absent the server must request the credentials. For these reasons, the API for the OpenAPI Security Provider is not trivial. 

## Permissions


### Configuring Basic Authentication

Create a new factory configuration for `biz.aQute.openapi.ua.basic`:

|  Key    | Comment                               | Default value                 |
|---------|---------------------------------------|-------------------------------|
| `name`  | Name of the security provider.        | `basic-auth`                  |
| `hash`  | Algorithm to hash the passwords       | `{ PLAIN, SHA,` **SHA_256**`,  SHA_512 }` |
| `salt`  | salt to use for the hashing           | `byte[]{}`                    |
| `idkey` | User Admin property key for id, when this is empty, the User id is used.   | `aQute.ua.id`                 |
| `pwkey` | The key in the users credentials for hashed password  | `aQute.ua.pw`                 |

The defaults should set you up ok. However, since this is a factory, you need to create it of course.

In Gogo you can now setup a user:

     G! basicauth -u u123456 some.user@example.com SECRET_PASSWORD
     some.user@example.com
{.shell}



[1]: https://github.com/aQute-os/biz.aQute.openapi/tree/master/biz.aQute.openapi.basicauth.example
[RFC 2617]: https://www.ietf.org/rfc/rfc2617.txt
[Amazon Signing Version 4]: http://docs.aws.amazon.com/general/latest/gr/signature-version-4.html
[shiro]: https://shiro.apache.org/
