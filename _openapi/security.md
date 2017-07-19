
# Open API Security

## Introduction

The Open API Suite Security implements the requirements regarding security in the Open API specification. The OpenAPI Suite has a design supporting the three required security schemes using OpenAPI Security Provider services. When the OpenAPI source requires a security check, the OpenAPI runtime will get the appropriate provider and pass it the defined parameters. The OpenAPI Security Provider will then answer what to do. 

Although called _security_ in the OpenAPI specification, this security is actually limited to _authentication_. This seems to imply that the answer from an OpenAPI Security Provider service is a simple boolean. However, in the OpenAPI specifications, it is possible to require multiple security providers in any combination of `and` and  `or`. For example, it is (theorethically) possible to require a Basic Authentication `or` and OAuth authentication. Though this is extremely flexible the specification does lack the details of how this should be implemented. The OpenAPI Suite provides a full implementation by providing pragmatic implementations.

The set of OpenAPI 2.0 specifications security schemes is rather limited. However, the OpenAPI Suite allows the existing schemes to be used with other authentication schemes. For example, it is straighforward to implement rate limiting schemes, monitoring, or support more secure forms of Basic Authentication. 

The OpenAPI specifications are moot on the _authorization_ aspects of writing microservices. However, authentication is closely connected to authorization. The _identity_ that is established with authentication is used to link to the set of _permissions_ that the request has. Unfortunately, in Java this is an area with lots of choices and even a number of false starts. The OpenAPI suite provides authentication based on Apache Shiro and for very lightweight implementations the OSGi User Admin service. In addition, providing your own authentication and/or authorization schemes is possible.

## Essentials

* Basic Authentication – Supports basic authentication as defined in [RFC 2617][1].
* API Key – Verification of a header or query parameter
* OAuth2 – Redirects the browser to another side for authentification
* Flexible – Applications can provide their own services for special schemes
* Off the shelf – Large number of OpenAPI Security Providers included out of the box
* Authorization – Leverage the OSGi enRoute Authority service to access Shiro, User Admin, or custom authorization schemes.

## Entities

* _OpenAPI Runtime_ – The runtime that executes the microservice requests.
* _OpenAPI Security Provider_ – Implements a named OpenAPI Security Scheme. Names are global and shared within a framework.
* _OpenAPI Security_ – Represents the user information for the OpenAPI suite. OpenAPI Security Providers can use this class to get/set user defined properties and credentials to authenticate a user. The OpenAPI runtime uses this class to verify the permissions.
* _OpenAPI Base_ – The base class used for microservices.
* _Servlet_ – The actual servlet used for dispatching microservice requests

## Architecture

The OpenAPI security architecture provides a pluggable system for the myriad of authentication and authorisation systems out there. It does this with a number of services.

![OpenAPI Security Diagram](https://user-images.githubusercontent.com/200494/28373206-0c07149a-6ca2-11e7-80b9-340fd56e7f0f.png)

## Authentication

Authentication is the process of establishing a trusted identity for a user. The Internet has spawned thousands of protocols describing how to authenticate users. The oldest one is called _basic authentication_ which is piggy backed on HTTP. This protocol adds an `Authorization` header 


In this example we implement the following OpenAPI source that has two methods that use basic authentication:

          {
               "swagger": "2.0",
               "securityDefinitions": {
                    "basicauth": {
                        "type": "basic"
                    }
               },
               "security": [ {
                         "basicauth":[]
               } ],
               "basePath": "/basic",
               "paths": {
                    "/authenticated": {
                         "get": {
                              "operationId": "authenticated"
                         }
                    },
                    "/unauthenticated": {
                         "get": {
                              "operationId": "unauthenticated",
                              "security": []
                         }
                    }
               }
          }


For each defined security provider in the OpenAPI source an OpenAPI Security Provider service must be registered. The service property `name` for this service must match the name of the service provider in the source.

To get started, use the security suite based on the OSGi User Admin service. This suite has an implementation for the different security provider types. For example, we need to configure the following security definition in the OpenAPI source:

     "basicauth": {
        "type": "basic"
      }
 
This translates to:

* Type is Basic Authentication
* Security definition name is `basicauth`

The following bundles are required to provide an OpenAPI Service Provider and Authority service based on User Admin.

* `biz.aQute.openapi.security.useradmin.provider` – Provides a configurable basic authentication provider. The key used in useradmin to find the given user name is configurable as is the salt and the hash used. It also provides a Gogo command to set and remove basic authentication ids and their hashed+salted password.
* `biz.aQute.useradmin.util` – Provides an implementation of the OSGi enRoute Authority based on the OSGi User Admin. Also here with a Gogo command to manipulate the users in User Admin.

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
