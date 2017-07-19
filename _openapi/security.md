
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

## Security Section

The `security` section can be defined in the prolog and overridden for each operation. In the prolog it defines the default security that is applied when no `security` section is defined in an operation. The `security` section primarily refers to a security definition although in the case of OAuth it can provide additional parameters for the local check. It looks as follows:

               "security": [ {
                         "basicauth":[]
               } ]

The security section is an array of _security requirements_. Each member of the array is an alternative. That is, any of the security requirements can match to succeed. The security requirement is a map where the keys are the names of the security definitions and the value is an array holding additional parameters. If you think this allows for mindboggling complex authentication schemes then we agree.

## Runtime

The code generated from the security information will authenticate the user just before the validation and the actual call to the microservice implementation. The authentication phase will try to find one of the alternative security requirements. However, this is harder then it sounds. Some authentication schemes can request credentials or take some action so that they can be authenticated. However, if one of the security requirements succeeds there should be no need to ask for credentials. The authentication code will therefore try to find a security requirement that succeeds. If no security requirement succeeds, the first OpenAPI Security Provider that could request credentials is asked to ask the caller to provide credentials.

For example, Basic Authentication checks the Authorization header. If there is no such header it can request such a header by setting the WWW-Authenticate header and returning a 403 error code to the caller. The Basic Authentication OpenAPI Security Provider will there indicate that it is not authenticated but it could set the response to request credentials. If the OpenAPI Runtime cannot find another OpenAPI Security Provider that says it is authenticated it will ask the Basic Authentication provider to request the credentials.

This sounds (and is) complicated. However, in most of the cases there is only a single security provider in play.



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
