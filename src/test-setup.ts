import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, TestModuleMetadata } from '@angular/core/testing';
import { ActivatedRoute, Params, convertToParamMap, provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { of } from 'rxjs';

function createActivatedRouteStub(params: Params = {}) {
  const paramMap = convertToParamMap(params);

  return {
    snapshot: {
      data: {},
      paramMap,
      queryParamMap: convertToParamMap({}),
      params,
      queryParams: {},
      url: [],
      fragment: null,
    },
    params: of(params),
    queryParams: of({}),
    paramMap: of(paramMap),
    queryParamMap: of(convertToParamMap({})),
    data: of({}),
    url: of([]),
    fragment: of(null),
  };
}

const defaultProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideRouter([]),
  provideMarkdown(),
  {
    provide: ActivatedRoute,
    useValue: createActivatedRouteStub(),
  },
] as NonNullable<TestModuleMetadata['providers']>;

const originalConfigureTestingModule = TestBed.configureTestingModule.bind(TestBed);

TestBed.configureTestingModule = ((moduleDef: TestModuleMetadata = {}) => {
  TestBed.resetTestingModule();

  return originalConfigureTestingModule({
    ...moduleDef,
    providers: [...defaultProviders, ...(moduleDef.providers ?? [])],
  });
}) as typeof TestBed.configureTestingModule;
