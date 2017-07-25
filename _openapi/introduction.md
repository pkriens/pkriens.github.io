# The OpenAPI Suite

## Goal
The goal of the OpenAPI Suite is to _simplify_  making secure _microservices_, where microservices are REST APIs that are made available over the Internet. 

## Scope

In the past years REST APIs have grown tremendously and most commercial systems today either call or provide REST APIs.  There are many different solutions for writing microservices. One of the drawbacks of many of those solutions is that there is no clear separation between the domain functions and the, often very complex, protocol issues around REST calls. Although REST is based on a few extremely simple concepts, the HTTP protocol and related security requirements defined in a hodgepodge of RFCs and specifications have made the writing secure microservices a daunting task. 

One of the interesting developments in the last few years was _Swagger_. Swagger defined a format, based on JSON, that is a formal definition of a REST API. It defines how a REST API can be called and it defines how a REST API can be automatically implemented without forcing domain developers to learn (too much) about the HTTP and other protocols. This is not just limited to the protocols. The OpenAPI specification also provides data validation, ensuring that any attacks or bad callers are detected early and rejected. Having the developers focus on their domain instead of protocols increases productivity. Maybe even more important, it improves security since the crucial infrastructure required is focused on protecting the internal code.

By having a formal specification of a REST API it is possible to create tooling that is independent of any given REST API. Tooling that can take the drudgery out of working with REST APIs. For example, there is a web based user interface that makes interacting with any site that is defined with Swagger/OpenAPI easier than [curl] or other command line tools. 

[Swagger][swagger] is opening up the specification and is becoming [OpenAPI][openapi].

## Span 

The OpenAPI Suite is an open source project focused on the Java language. It provides (or is planning to provide) the following features:

* Gradle, Maven, and command line based tools to generate Java source code
* JavaEE, JavaSE, and OSGi based runtime
* Implementations for OpenAPI authentication and authorization
* Bridges to applicable open source libraries, for example Apache Shiro 

## Example Workflow

Assume the company ACME Inc. has a thermometer that they want to provide a REST service for. The API is defined in an OpenAPI 2.0 file.

    {  
      "swagger":"2.0",
      "info":{  
        "version":"1.0",
        "title":"Thermometer"
      },
      "securityDefinitions":{  
        "basicauth":{  
          "type":"basic"
        }
      },
      "security":[  
        {  
          "basicauth":[]
        }
      ],
      "basePath":"/acme/v1",
      "paths":{  
        "/temperature":{  
          "get":{  
            "operationId":"temperature",
            "responses":{  
              "200":{  
                "schema":{  
                  "description": "Degrees celsius",
                  "type":"number"
                }
              }
            }
          }
        }
      }
    }

This file defines a REST protocol protected with basic authentication for security. It defines a REST API with one _operation_: `temperature`. This call returns the temperature in degrees celsius in a number.

Maven, Gradle, or command line tools in the OpenAPI Suite can take this OpenAPI _source_ and turn it into generated Java code. This Java code creates a base class that can then be _extended_ by the domain developer. The base class has a number of abstract methods that need to be overridden by the domain developer. For example in Eclipse:

    public class Temperature extends TemperatureBase {
      @Override
      protected double temperature() throws Exception {
        // TODO Auto-generated method stub
        return 0;
      }
    }

The remaining task for the developer is now to write the implementation.


[curl]: https://curl.haxx.se/
[swagger]: https://swagger.io/
[openapi]: https://www.openapis.org
