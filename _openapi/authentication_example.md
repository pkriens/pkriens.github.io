# OpenAPI Authentication Example

The security model of the OpenAPI specifications allows for, although looking innocent, quite complex constellations. The OpenAPI suite therefore contains a demonstration application that shows:

* Usage of the provided authenticators (OAuth, Basic, and ApiKey)
* Using the User Admin bridge
* How to implement an Authenticator

This example should provide a good guide how to use security in an OpenAPI application.

## Scope

Out of the box, the `biz.aQute.openapi.authentication.example` contains providers for the supported OpenAPI 













-----------------------





* Type is Basic Authentication
* Security definition name is `basicauth`

The following bundles are required to provide an OpenAPI Service Provider and Authority service based on User Admin.

* `biz.aQute.openapi.security.useradmin.provider` – Provides a configurable basic authentication provider. The key used in useradmin to find the given user name is configurable as is the salt and the hash used. It also provides a Gogo command to set and remove basic authentication ids and their hashed+salted password.
* `biz.aQute.useradmin.util` – Provides an implementation of the OSGi enRoute Authority based on the OSGi User Admin. Also here with a Gogo command to manipulate the users in User Admin.

## Authentication

Authentication is the process of establishing a trusted identity for a user. The Internet has spawned thousands of protocols describing how to authenticate users. The OpenAPI suite defins the OpenAPI Authenticator service as an abstraction for these protocols. Although some protocols are simply userid password verifications like Basic Authentication, other protocols implement complex redirect flows. However, even Basic Authentication requires more than just answering a simple question. If the Authorization header is absent the server must request the credentials. For these reasons, the API for the OpenAPI Authenticator is not trivial. 

## Permissions


